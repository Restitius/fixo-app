from app.registries.messages.message_registry import MessageRegistry
from app.startup.register_messages import register_messages


def test_domain_messages_are_registered_with_stable_keys():
    registry = MessageRegistry()
    register_messages(registry)

    assert registry.get("authentication.login_failed")["title"] == "Sign-in failed"
    assert registry.get("authentication.otp_sent")["title"] == "Verification code sent"
    assert registry.get("MSG.AUTH.LOGIN.INVALID_CREDENTIALS.V1")["presentation"] == "card"
    assert registry.get("MSG.AUTH.PASSWORD.TOO_SHORT.V1", {"minimum": 8})["body"] == (
        "Use at least 8 characters."
    )
    assert registry.count() >= 20
