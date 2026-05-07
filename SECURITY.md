# Security hardening notes for LoJix FM

1) UFW basics (example):

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
# Allow live DJ port (restrict with --source for trusted IPs if possible)
ufw allow 8001/tcp comment "LoJix FM Live DJ"
ufw enable
```

2) Fail2ban for Icecast (example):

Create `/etc/fail2ban/filter.d/icecast.conf` with appropriate patterns.

3) Docker security recommendations:
- Run containers with minimal privileges
- Use bind-to-localhost for backend/frontend/icecast when behind Apache
- Keep images up-to-date and pin versions in production

4) API and Auth:
- Use strong `JWT_SECRET` and rotate if needed
- Rate-limit admin endpoints (already configured in NestJS)
