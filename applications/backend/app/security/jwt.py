"""JwtService — token minting/verification (PyJWT)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt


class AuthenticationError(Exception):
    # Raised when a token fails signature/expiry/issuer checks.
    pass


class JwtService:
    def __init__(
        self,
        secret: str,
        *,
        algorithm: str = "HS256",
        access_ttl_seconds: int = 3600,
        refresh_ttl_seconds: int = 60 * 60 * 24 * 14,
        issuer: str = "FIXO-APP",
    ) -> None:
        self.secret = secret
        self.algorithm = algorithm
        self.access_ttl_seconds = access_ttl_seconds
        self.refresh_ttl_seconds = refresh_ttl_seconds
        self.issuer = issuer

    def encode_access(self, claims: dict) -> str:
        return self._encode(claims, self.access_ttl_seconds, "access")

    def encode_refresh(self, claims: dict) -> str:
        return self._encode(claims, self.refresh_ttl_seconds, "refresh")

    def decode(self, token: str, *, expect_refresh: bool = False) -> dict:
        try:
            claims = jwt.decode(
                token,
                self.secret,
                algorithms=[self.algorithm],
                issuer=self.issuer,
            )
        except jwt.ExpiredSignatureError as exc:
            raise AuthenticationError("token expired") from exc
        except jwt.InvalidTokenError as exc:
            raise AuthenticationError("invalid token") from exc

        want = "refresh" if expect_refresh else "access"
        if claims.get("typ") != want:
            raise AuthenticationError(f"expected {want} token")
        return claims

    def _encode(self, claims: dict, ttl: int, typ: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            **claims,
            "iss": self.issuer,
            "iat": now,
            "exp": now + timedelta(seconds=ttl),
            "typ": typ,
        }
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)
