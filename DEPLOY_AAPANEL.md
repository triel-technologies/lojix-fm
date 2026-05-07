# Deployment with aaPanel + Apache

Quick summary to deploy LoJix FM behind aaPanel using Apache as reverse proxy.

1. Copy repo to server

```bash
sudo mkdir -p /opt/lojixfm
sudo rsync -av --exclude "node_modules" --exclude ".next" ./ /opt/lojixfm/
cd /opt/lojixfm
```

2. Edit `.env` and fill values (domain, passwords, secrets).

3. Install Docker & Compose

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose ufw ffmpeg git curl
```

4. Place Piper models in `piper/models/` (download from the README).

5. Start containers (binds to localhost, Apache will proxy):

```bash
docker compose build
docker compose up -d
```

6. In aaPanel → Website → select domain → Settings → Config: paste `apache/lojix.my.id.conf`.
   - Ensure Apache modules enabled: `proxy proxy_http proxy_wstunnel rewrite headers ssl`.

7. SSL: aaPanel → Website → SSL → Let's Encrypt → enable and force HTTPS.

8. Firewall: allow ports 80, 443, and 8001 for live DJ input (restrict to trusted IPs if possible).

9. Verify endpoints locally on server:

```bash
curl -I http://127.0.0.1:8000/status.xsl
curl -I http://127.0.0.1:3001/api/status
```

10. Verify via domain:

```bash
curl -I https://YOUR_DOMAIN/live
curl https://YOUR_DOMAIN/api/now-playing
```

11. Install systemd service to auto-start on boot (example provided in README).

Troubleshooting:
- If streams buffer in browser, enable `SetEnv proxy-initial-not-buffered 1` (already in config) and ensure `RequestHeader unset Accept-Encoding` to prevent gzip.
- If Icecast not reachable, check container ports and ensure Apache proxy targets `127.0.0.1:8000`.
