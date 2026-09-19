"""Customer-protection domain errors (cancellation / support / disputes)."""


class ProtectionError(Exception):
    """Base class for customer-protection failures."""


class BookingNotCancellable(ProtectionError):
    """Booking missing, not owned, or past its cancellable window."""


class TicketNotFound(ProtectionError):
    """Support ticket missing or not owned by the caller."""


class TicketClosed(ProtectionError):
    """Ticket is closed; no further messages accepted."""


class DisputeError(ProtectionError):
    """Dispute cannot be opened or changed."""
