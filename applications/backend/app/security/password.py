"""PasswordHasher — bcrypt hashing + verification (bcrypt package)."""
from __future__ import annotations

import logging

import bcrypt

logger = logging.getLogger(__name__)


class PasswordHasher:
    # bcrypt has a 72-byte input limit; pre-hash long passwords with sha256.
    def __init__(self, rounds: int = 12) -> None:
        self.rounds = rounds

    def hash(self, raw_password: str) -> str:
        digest = self._digest(raw_password)
        return bcrypt.hashpw(digest, bcrypt.gensalt(rounds=self.rounds)).decode()

    def verify(self, raw_password: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(self._digest(raw_password), hashed.encode())
        except Exception:
            logger.warning("password verify failed (malformed hash)")
            return False

    def needs_rehash(self, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(b"probe", hashed.encode()) is False or False
        except Exception:
            return True

    @staticmethod
    def _digest(raw_password: str) -> bytes:
        import hashlib

        return hashlib.sha256(raw_password.encode()).hexdigest().encode()
