# LoJix FM

This repository contains scaffolding and configs to run LoJix FM on an Ubuntu server with aaPanel/Apache.

Quick start (server):

1. Prepare server and install dependencies:

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose ufw ffmpeg git curl
```

2. Place your PIPER model files in `piper/models/` (see download steps in project docs).

3. Edit `.env` and fill secrets.

4. Build and start containers:

```bash
cd /opt/lojixfm
docker compose build
docker compose up -d
```

5. Configure aaPanel / Apache: paste `apache/lojix.my.id.conf` into site config.

6. Verify endpoints (example):

```bash
# Icecast status
curl -I http://127.0.0.1:8000/status.xsl
# Stream via domain
curl -I https://lojix.my.id/live
```

Files created in this scaffold:

- `.env` — environment variables
- `docker-compose.yml` — main compose stack
- `icecast/icecast.xml` — Icecast2 config
- `apache/lojix.my.id.conf` — Apache virtualhost for aaPanel
- `liquidsoap/radio.liq` — Liquidsoap script
- `liquidsoap/Dockerfile` — Liquidsoap image build
- `piper/generate.sh` — Piper TTS helper
- `watchdog/watchdog.py` — silence watchdog
