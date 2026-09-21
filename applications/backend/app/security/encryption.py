"""FieldCipher — application-level encryption for sensitive columns."""
from __future__ import annotations


class FieldCipher:
    """AES-GCM field encryption keyed from secrets (cryptography lib)."""

    def __init__(self, key_env: str = "FIELD_ENCRYPTION_KEY") -> None:
        self.key_env = key_env

    def encrypt(self, plaintext: str) -> str:
        raise NotImplementedError("FieldCipher.encrypt")

    def decrypt(self, token: str) -> str:
        raise NotImplementedError("FieldCipher.decrypt")
