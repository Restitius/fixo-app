"""Query ID constants for the transactions domain (section 6)."""
from __future__ import annotations


class TransactionQueries:
    CREATE = "TRANSACTION.CREATE"
    GET_BY_ID = "TRANSACTION.GET_BY_ID"
    LIST = "TRANSACTION.LIST"
    SUMMARY = "TRANSACTION.SUMMARY"
    UPDATE = "TRANSACTION.UPDATE"
    SETTLE = "TRANSACTION.SETTLE"
    ARCHIVE = "TRANSACTION.ARCHIVE"
