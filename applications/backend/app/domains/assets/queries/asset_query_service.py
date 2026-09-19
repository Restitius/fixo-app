"""Asset SQL adapter re-export — preserves domain-import compatibility (shim)."""
from app.adapters.persistence.asset_sql_adapter import AssetSqlAdapter as SqlAssetAdapter

__all__ = ["SqlAssetAdapter"]
