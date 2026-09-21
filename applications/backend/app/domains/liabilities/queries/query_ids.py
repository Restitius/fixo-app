"""Query ID constants for the liabilities domain (section 6)."""
from __future__ import annotations


class LiabilityQueries:
    CREATE = "LIABILITY.CREATE"
    GET_BY_ID = "LIABILITY.GET_BY_ID"
    LIST = "LIABILITY.LIST"
    SUMMARY = "LIABILITY.SUMMARY"
    UPDATE = "LIABILITY.UPDATE"
    RESTRUCTURE = "LIABILITY.RESTRUCTURE"
    ARCHIVE = "LIABILITY.ARCHIVE"
