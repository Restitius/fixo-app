"""Repository shim — re-exports the canonical AssetSqlAdapter (keeps imports working)."""
from app.adapters.persistence.asset_sql_adapter import AssetSqlAdapter as SqlAssetRepository

__all__ = ["SqlAssetRepository"]
