"""Query-ID constants (shim) — canonical values live on the adapter.

    from app.domains.assets.queries.query_ids import AssetQueries  # preserved

The governed query IDs now live in `app/adapters/persistence/asset_sql_adapter.py`
(AssetQueryIds) so the domain no longer owns infrastructure identifiers.
"""
from app.adapters.persistence.asset_sql_adapter import AssetQueryIds as AssetQueries

__all__ = ["AssetQueries"]
