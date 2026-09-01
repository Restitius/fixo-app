"""WebSocket channel — realtime fan-out to connected sessions."""
from __future__ import annotations


class WebSocketChannel:
    name = "websocket"

    async def deliver(self, recipient_id: str, subject: str, body: str, meta: dict) -> bool:
        raise NotImplementedError("WebSocketChannel.deliver")
