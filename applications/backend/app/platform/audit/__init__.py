"""Platform audit package — facade over audit recording."""
from app.audit.audit_service import AuditService as RegisteredAuditManager

__all__ = ["RegisteredAuditManager"]