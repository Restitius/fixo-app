from abc import abstractmethod
from typing import Any, Protocol


class ProviderInvoicesRepository(Protocol):
    @abstractmethod
    async def list(self, provider_id: str, *, limit: int = 50, offset: int = 0) -> list[Any]: ...

    @abstractmethod
    async def get(self, provider_id: str, *, invoice_id: str) -> Any | None: ...

    @abstractmethod
    async def summary(self, provider_id: str) -> Any: ...