```markdown
<!-- SETUP.md -->

# Production Deployment Guide (Ubuntu 22.04 LTS VPS)

The steps below upgrade an **empty $5–$10 Droplet/EC2/Linode** into a publicly reachable VoyAI demo, *without assuming* prior DevOps experience.

---

## 0  Pre-flight Checklist

| Item | OK? |
|------|-----|
| Fresh **Ubuntu 22.04** server (1 vCPU / 1 GB RAM works) | ☐ |
| Root or sudo user login | ☐ |
| Domain name ⚡ (**recommended**) pointing to your server’s IP | ☐ |
| Ports **80/443** open in your provider’s firewall | ☐ |

---

## 1  SSH In & Harden Basics

```bash
ssh root@<YOUR_IP>

# System refresh
apt update && apt -y upgrade

# (Optional) create non-root user
adduser deploy
usermod -aG sudo deploy
````

Log back in as `deploy` from now on.

---

## 2  Install Core Packages

```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs build-essential

# PostgreSQL 14
sudo apt -y install postgresql postgresql-contrib

# NGINX for reverse proxy
sudo apt -y install nginx
```

---

## 3  Create Database & User

```bash
sudo -u postgres psql

-- inside psql —
CREATE USER voyai_user WITH PASSWORD 'CHANGE_ME_STRONG';
CREATE DATABASE voyai OWNER voyai_user;
\q
```

### (Optional) import seed schema

```bash
psql -U voyai_user -d voyai -f /home/deploy/voyai/backend/prisma/migrations/*_init/migration.sql
```

---

## 4  Clone Repository & Configure Environment

```bash
cd /home/deploy
git clone https://github.com/your-org/voyai.git
cp voyai/backend/.env.example voyai/backend/.env
nano voyai/backend/.env   # fill DATABASE_URL & JWT_SECRET
```

> **DATABASE\_URL** format:
> `postgresql://voyai_user:CHANGE_ME_STRONG@localhost:5432/voyai`

---

## 5  Choose **ONE** Deployment Mode

### A) Bare-metal (PM2 + NGINX) — easiest to debug

```bash
# Install dependencies
npm --prefix voyai/backend install
npm --prefix voyai/frontend install && npm --prefix voyai/frontend run build

# Process manager keeps the API alive
sudo npm i -g pm2
pm2 start voyai/backend/index.js --name voyai-api
pm2 save && pm2 startup         # prints a systemd snippet; run it

# Serve the built SPA statically
sudo mkdir -p /var/www/voyai
sudo cp -r voyai/frontend/dist/* /var/www/voyai/
```

Create `/etc/nginx/sites-available/voyai`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;   # or _ for IP

    root /var/www/voyai;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/voyai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

#### HTTPS (Let’s Encrypt)

```bash
sudo apt -y install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

NGINX will reload with port 443 and SSL certs.

---

### B) Containerised (Docker Compose) — fire-and-forget

> Good if you already use Docker elsewhere, or want *one-command updates*.

```bash
sudo apt -y install docker.io docker-compose
sudo usermod -aG docker $USER && newgrp docker

cd /home/deploy/voyai
cp env.example .env  # optional, Compose overrides env per service

docker compose pull          # get latest postgres
docker compose build         # build backend & frontend images
docker compose up -d
```

* **Frontend** served on port `3000`.
* **API** on `5000` (internally) – exposed to NGINX if you proxy.
* **Database** in a named volume (`voyai_db_data`) so image upgrades keep data.

---

## 6  Smoke-Test the Install

1. Browse to `http://yourdomain.com`
2. Register a new admin user.
3. Open `/dashboard`, confirm charts populate (will be empty at first).
4. Wait 5 minutes – you should see a *“Channels synced”* toast (WebSocket).

If any step fails, run:

```bash
# Bare-metal
pm2 logs voyai-api
# Docker
docker compose logs backend
```

---

## 7  Troubleshooting Cheat-Sheet

| Symptom                           | Fix                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| **502 Bad Gateway**               | NGINX can’t reach port 5000 → Check PM2/Docker port bindings.                                       |
| **`ECONNREFUSED` in logs**        | DATABASE\_URL wrong user/pass/host → `psql` in and test manually.                                   |
| Frontend shows but API 401 errors | JWT expired → re-login or correct `JWT_SECRET` mismatch.                                            |
| Channel sync crashes              | You are in *real* mode without Booking.com/Airbnb keys. Set `SIM_MODE=true` or provide credentials. |

---
