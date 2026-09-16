# --- build stage -------------------------------------------------
# Compiles anything requiring build-essential once; none of that toolchain
# ships in the final image.
FROM python:3.12-slim AS build
ENV PIP_NO_CACHE_DIR=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# --- runtime stage -----------------------------------------------
FROM python:3.12-slim AS runtime
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.source="https://github.com/Restitius/fixo-app" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.vendor="FIXO"

RUN apt-get update \
    && apt-get install -y --no-install-recommends tini curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 fixo \
    && useradd --system --uid 10001 --gid fixo --no-create-home fixo

COPY --from=build /install /usr/local
COPY --chown=fixo:fixo . /srv
WORKDIR /srv
RUN mkdir -p /srv/storage && chown -R fixo:fixo /srv/storage

USER 10001:10001
EXPOSE 8000
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:8000/api/v1/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
