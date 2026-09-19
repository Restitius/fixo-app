"""Elasticsearch index adapter."""
from __future__ import annotations

from typing import Any


class ElasticsearchIndex:
    def __init__(self, url: str, index: str, *, api_key_env: str = "SEARCH_ES_API_KEY") -> None:
        self.url = url
        self.index = index
        self.api_key_env = api_key_env

    async def index_document(self, doc_id: str, document: dict[str, Any]) -> None:
        raise NotImplementedError("ElasticsearchIndex.index_document")

    async def search(self, query: dict[str, Any], *, size: int = 20) -> list[dict[str, Any]]:
        raise NotImplementedError("ElasticsearchIndex.search")

    async def delete_document(self, doc_id: str) -> None:
        raise NotImplementedError("ElasticsearchIndex.delete_document")
