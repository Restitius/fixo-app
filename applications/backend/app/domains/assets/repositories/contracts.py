"""Repository contract for assets (dependency inversion boundary).

Canonical definition lives at app/ports/persistence/asset_repository.py.

    AssetService -> AssetRepository (THIS protocol)
                      -> AssetSqlAdapter -> SQLQueryManager -> ...
"""
from app.ports.persistence.asset_repository import AssetRepository

__all__ = ["AssetRepository"]
