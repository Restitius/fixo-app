"""S3-compatible object storage backend (boto3/aioboto3)."""
from __future__ import annotations


class S3Storage:
    def __init__(
        self,
        bucket: str,
        *,
        endpoint_url: str | None = None,
        region: str | None = None,
        credentials_key: str = "STORAGE_S3",
    ) -> None:
        self.bucket = bucket
        self.endpoint_url = endpoint_url
        self.region = region
        self.credentials_key = credentials_key

    async def put(self, key: str, data: bytes, content_type: str | None = None) -> str:
        raise NotImplementedError("S3Storage.put")

    async def get(self, key: str) -> bytes:
        raise NotImplementedError("S3Storage.get")

    async def delete(self, key: str) -> None:
        raise NotImplementedError("S3Storage.delete")

    def url(self, key: str, expires_in: int = 3600) -> str:
        raise NotImplementedError("S3Storage.url (presigned)")
