"""AuthenticationMessages — user-facing copy catalog."""
from __future__ import annotations

from app.registries.messages.message_definition import MessageDefinition

MESSAGE_DEFINITIONS = (
    MessageDefinition(
        "MSG.AUTH.REGISTER.SUCCESS.V1", "success", "card", "Account created", "Welcome to FIXO."
    ),
    MessageDefinition(
        "MSG.AUTH.LOGIN.SUCCESS.V1", "success", "card", "Signed in", "Welcome back."
    ),
    MessageDefinition(
        "MSG.AUTH.LOGIN.INVALID_CREDENTIALS.V1",
        "error",
        "card",
        "Sign-in failed",
        "The email address or password is incorrect.",
        action_id="AUTH.LOGIN.RETRY",
        action_label="Try again",
    ),
    MessageDefinition(
        "MSG.AUTH.LOGIN.REQUIRED_FIELDS.V1",
        "warning",
        "inline",
        "Complete sign-in",
        "Enter your email address and password to continue.",
    ),
    MessageDefinition(
        "MSG.AUTH.EMAIL.INVALID.V1",
        "warning",
        "inline",
        "Check your email",
        "Enter a valid email address.",
    ),
    MessageDefinition(
        "MSG.AUTH.PASSWORD.TOO_SHORT.V1",
        "warning",
        "inline",
        "Password too short",
        "Use at least {minimum} characters.",
        required_params=("minimum",),
    ),
    MessageDefinition(
        "MSG.AUTH.OTP.SENT.V1",
        "info",
        "card",
        "Verification code sent",
        "Enter the code sent to your account to continue.",
    ),
    MessageDefinition(
        "MSG.AUTH.OTP.INVALID.V1",
        "error",
        "card",
        "Code not accepted",
        "Check the verification code and try again.",
        action_id="AUTH.OTP.RETRY",
        action_label="Try again",
    ),
    MessageDefinition(
        "MSG.AUTH.OTP.VERIFIED.V1", "success", "card", "Verified", "Your account is verified."
    ),
    MessageDefinition(
        "MSG.AUTH.PASSWORD.RESET_SENT.V1",
        "info",
        "card",
        "Reset instructions sent",
        "Check your account for the password reset code.",
    ),
    MessageDefinition(
        "MSG.AUTH.PASSWORD.RESET_COMPLETE.V1",
        "success",
        "card",
        "Password reset",
        "Sign in with your new password.",
        action_id="AUTH.LOGIN.OPEN",
        action_label="Sign in",
    ),
    MessageDefinition(
        "MSG.AUTH.SESSION.EXPIRED.V1",
        "warning",
        "card",
        "Session expired",
        "Sign in again to continue.",
        action_id="AUTH.LOGIN.OPEN",
        action_label="Sign in",
    ),
    MessageDefinition(
        "MSG.AUTH.SESSION.REFRESHED.V1",
        "success",
        "toast",
        "Session renewed",
        "Your access token was renewed.",
    ),
    MessageDefinition(
        "MSG.AUTH.LOGOUT.SUCCESS.V1", "success", "toast", "Signed out", "Your session has ended."
    ),
)

MESSAGES: dict[str, dict[str, str]] = {
    "login_ok": {"title": "Signed in", "body": "Welcome back."},
    "login_failed": {"title": "Sign-in failed", "body": "Invalid credentials."},
    "logged_out": {"title": "Signed out", "body": "Your session has ended."},
    "refreshed": {"title": "Session renewed", "body": "Your access token was renewed."},
    "sessions_listed": {"title": "Sessions loaded", "body": "Active sessions retrieved."},
    "email_invalid": {"title": "Check your email", "body": "Enter a valid email address."},
    "password_short": {
        "title": "Password required",
        "body": "Your password must contain at least 6 characters.",
    },
    "otp_sent": {
        "title": "Verification code sent",
        "body": "Enter the code sent to your account to continue.",
    },
    "otp_failed": {"title": "Code not accepted", "body": "Check the verification code and try again."},
    "reset_sent": {
        "title": "Reset instructions sent",
        "body": "Check your account for the password reset code.",
    },
    "password_reset": {"title": "Password reset", "body": "Sign in with your new password."},
}


def get(action: str) -> dict[str, str]:
    return MESSAGES.get(action, {"title": "Success", "body": ""})
