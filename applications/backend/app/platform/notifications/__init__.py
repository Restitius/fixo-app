"""Platform notifications package — facade over notification lifecycle."""
from app.notifications.manager import NotificationManager as RegisteredNotificationManager
from app.notifications.manager import NotificationResult

__all__ = ["RegisteredNotificationManager", "NotificationResult"]