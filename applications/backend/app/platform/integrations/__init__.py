"""Platform integration package — facade over external/internal integration managers."""
from app.contracts.integration import Integration as IntegrationContract

__all__ = ["IntegrationContract"]