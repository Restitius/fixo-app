from typing import Any


class ProviderKpisService:
    def __init__(self, kpis: Any) -> None:
        self._kpis = kpis

    async def list_kpis(
        self,
        provider_id: str,
        *,
        period: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Any]:
        return await self._kpis.list(provider_id, period=period, limit=limit, offset=offset)

    async def get_summary(self, provider_id: str) -> Any:
        return await self._kpis.summary(provider_id)