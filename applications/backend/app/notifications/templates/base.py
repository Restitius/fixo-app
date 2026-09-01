"""TemplateRenderer — renders notification bodies from templates."""
from __future__ import annotations


class TemplateRenderer:
    """Templates live in app/notifications/templates/ (jinja2-ready)."""

    def render(self, template_id: str, context: dict) -> str:
        raise NotImplementedError("TemplateRenderer.render")
