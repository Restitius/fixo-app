"""Adapters — the ONLY app layer that may touch managers, registries, query IDs and infrastructure.

Flow:

    ApplicationService → Port → Adapter → Manager → Registry → Infrastructure
"""
# Re-exported adapter implementations are added here as they land.
from app.adapters.persistence.asset_sql_adapter import AssetSqlAdapter

__all__ = ["AssetSqlAdapter"]