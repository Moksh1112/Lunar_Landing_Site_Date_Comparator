# syntax=docker/dockerfile:1.7
# Build from the repo root; mission data is NOT in git and comes from a named build context:
#   docker build -f backend/Dockerfile --build-context data=C:/azelux-data -t azelux-backend .
# See backend/docs/DEPLOY.md.

# ---- 1. Python dependencies from the locked set (no dev group) ---------------------
FROM python:3.12-slim AS builder
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1
RUN pip install uv==0.12.5 && python -m venv /opt/venv
WORKDIR /build
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv export --locked --no-dev --no-emit-project --format requirements-txt -o requirements.txt \
 && /opt/venv/bin/pip install -r requirements.txt

# ---- 2. Data subset (tolerates a missing tiles/ directory) -------------------------
FROM busybox:1.37 AS data-subset
RUN mkdir -p /out/dem /out/tiles /stage
COPY --from=data /kernels/ /out/kernels/
COPY --from=data /cache/ /out/cache/
COPY --from=data /dem/far_160m.tif /dem/south_pole_hillshade_2048.png /dem/south_pole_hillshade_2048.json /out/dem/
# MANIFEST.json always exists, so the glob never leaves COPY without a source; tiles/*.tif land in /stage.
COPY --from=data /MANIFEST.json /tiles* /stage/
RUN find /stage -name '*.tif' -exec mv {} /out/tiles/ \; ; rm -rf /stage

# ---- 3. Runtime ---------------------------------------------------------------------
FROM python:3.12-slim
ENV PATH=/opt/venv/bin:$PATH \
    PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 \
    AZX_DATA_DIR=/data AZX_USE_MOCK=false PORT=8000
RUN useradd --system --uid 10001 --create-home azelux
COPY --from=builder /opt/venv /opt/venv
WORKDIR /srv/backend
COPY backend/app ./app
COPY fixtures /srv/fixtures
COPY --from=data-subset /out /data
# the skyline cache is written at runtime for new sites
RUN chown -R azelux:azelux /data/cache
USER azelux
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import os,urllib.request as u; u.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8000')+'/health', timeout=4)"
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --app-dir /srv/backend"]
