"""User-visible service lifecycle notification catalogue.

All customer and provider clients consume these events through the shared
notification outbox.  Keeping the copy and channel policy here gives web and
mobile the same message for the same business transition.
"""

from __future__ import annotations

from app.registries.notifications.notification_definition import NotificationDefinition


def _event(
    key: str,
    category: str,
    recipient: str,
    title: str,
    body: str,
    *required_data: str,
) -> NotificationDefinition:
    return NotificationDefinition(
        key=key,
        category=category,
        recipients=(recipient,),
        channels={recipient: ("database",)},
        required_data=tuple(required_data),
        title_template=title,
        body_template=body,
    )


NOTIFICATION_DEFINITIONS = (
    _event(
        "NTF.REQUEST.SUBMITTED.V1",
        "REQUEST_UPDATES",
        "customer",
        "Request submitted",
        "Request {request_number} is ready for provider quotations.",
        "request_id",
        "request_number",
    ),
    _event(
        "NTF.QUOTE.SUBMITTED.V1",
        "QUOTE_UPDATES",
        "customer",
        "New quotation received",
        "A provider submitted a quotation for request {request_number}.",
        "request_id",
        "request_number",
        "quote_id",
    ),
    _event(
        "NTF.QUOTE.ACCEPTED.V1",
        "QUOTE_UPDATES",
        "provider",
        "Quotation accepted",
        "Your quotation for request {request_number} was accepted.",
        "request_id",
        "request_number",
        "quote_id",
    ),
    _event(
        "NTF.QUOTE.EXPIRED.V1",
        "QUOTE_UPDATES",
        "provider",
        "Quotation closed",
        "Another quotation was selected for request {request_number}.",
        "request_id",
        "request_number",
        "quote_id",
    ),
    _event(
        "NTF.BOOKING.ACKNOWLEDGED.V1",
        "BOOKING_UPDATES",
        "customer",
        "Booking acknowledged",
        "Your provider acknowledged booking {booking_number}.",
        "booking_id",
        "booking_number",
    ),
    _event(
        "NTF.PAYMENT.AUTHORIZATION_FAILED.V1",
        "PAYMENT_RECEIPTS",
        "customer",
        "Payment authorization failed",
        "Payment could not be authorized for booking {booking_number}. Please try again.",
        "booking_id",
        "booking_number",
    ),
    _event(
        "NTF.SERVICE.STARTED.V1",
        "BOOKING_UPDATES",
        "customer",
        "Service started",
        "Work has started for booking {booking_number}.",
        "booking_id",
        "booking_number",
    ),
    _event(
        "NTF.CHANGE.PROPOSED.V1",
        "BOOKING_UPDATES",
        "customer",
        "Change approval required",
        "Your provider proposed a change for booking {booking_number}.",
        "booking_id",
        "booking_number",
        "change_id",
    ),
    _event(
        "NTF.CHANGE.APPROVED.V1",
        "BOOKING_UPDATES",
        "provider",
        "Change approved",
        "The customer approved your change for booking {booking_number}.",
        "booking_id",
        "booking_number",
        "change_id",
    ),
    _event(
        "NTF.CHANGE.REJECTED.V1",
        "BOOKING_UPDATES",
        "provider",
        "Change declined",
        "The customer declined your change for booking {booking_number}.",
        "booking_id",
        "booking_number",
        "change_id",
    ),
    _event(
        "NTF.BOOKING.CANCELLED.V1",
        "BOOKING_UPDATES",
        "provider",
        "Booking cancelled",
        "The customer cancelled booking {booking_number}.",
        "booking_id",
        "booking_number",
    ),
    _event(
        "NTF.REVIEW.RECEIVED.V1",
        "REVIEW_UPDATES",
        "provider",
        "New customer review",
        "Booking {booking_number} received a {rating}-star review.",
        "booking_id",
        "booking_number",
        "rating",
    ),
    _event(
        "NTF.VERIFICATION.APPROVED.V1",
        "ACCOUNT_UPDATES",
        "provider",
        "Verification approved",
        "Your {doc_type} document was approved.",
        "doc_id",
        "doc_type",
    ),
    _event(
        "NTF.VERIFICATION.REJECTED.V1",
        "ACCOUNT_UPDATES",
        "provider",
        "Verification needs attention",
        "Your {doc_type} document was not approved. Review the notes and submit again.",
        "doc_id",
        "doc_type",
    ),
)
