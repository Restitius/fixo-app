# FIXO-APP

Monorepo for FIXO-APP, split into two independent applications under
`applications/`:

    FIXO-APP/
    |-- applications/
    |   |-- backend/     FastAPI service — domain-oriented, registry-driven,
    |   |                query-governed, event-driven, observable, secure.
    |   |                See applications/backend/README.md for the full
    |   |                architecture, request lifecycle, and quickstart.
    |   '-- frontend/    Client application (not yet implemented).
    |                    See applications/frontend/README.md.
    '-- README.md        This file.

## Quickstart

### Backend (FastAPI)

    cd applications/backend
    # Bash/WSL/Git-Bash
    scripts/bootstrap.sh
    source .venv/bin/activate
    scripts/start.sh            # http://localhost:8000/docs

    # Windows PowerShell
    python -m venv .venv; .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    uvicorn app.main:app --reload

    # Or containerized
    docker compose up --build

    # Tests
    pytest

### Frontend

Not yet implemented — see `applications/frontend/README.md` for the
conventions the client app must follow when it is scaffolded (API prefix,
response envelope, `X-Screen-ID` header, etc.).

## Notes

- Each application under `applications/` is self-contained with its own
  dependency manifest, environment file, and tooling config — there is no
  shared root-level dependency file.
- The root `.gitignore` covers ignore patterns for both the Python backend
  and a future Node-based frontend.
