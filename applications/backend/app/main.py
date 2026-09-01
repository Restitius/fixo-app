"""ASGI entrypoint — deliberately tiny (architecture section 13).

Run::

    uvicorn app.main:app --reload
"""
from app.startup.application import create_application

app = create_application()
