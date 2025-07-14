# VPS Deployment Guide for VoyAI

This guide provides step-by-step instructions to deploy the VoyAI application on a standard Linux VPS (e.g., Ubuntu 22.04). Assumes corrected structure (backend/ contains all server files).

**Prerequisites**:
- A VPS with root or sudo access.
- A domain name pointed at your VPS's IP address (recommended for HTTPS).
- All project files (backend/, frontend/, database.sql) uploaded (e.g., via git or scp).

---

### Step 1: Initial Server Setup

## Connect to your VPS via SSH:
ssh root@your_vps_ip

## Update packages:
sudo apt update && sudo apt upgrade -y

### Step 2: Install Dependencies (Node.js, PostgreSQL, Nginx)

##Install Node.js (v20):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

##Install PostgreSQL:
sudo apt install -y postgresql postgresql-contrib

##Install Nginx (for reverse proxy):
sudo apt install -y nginx


### Step 3: Set Up the PostgreSQL Database

##Start and enable PostgreSQL:
sudo systemctl start postgresql
sudo systemctl enable postgresql

##Create user and DB:
sudo -u postgres psql

##In psql:
CREATE USER voyai_user WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE voyai;
GRANT ALL PRIVILEGES ON DATABASE voyai TO voyai_user;
\q

##Import schema (upload database.sql first):
psql -U voyai_user -d voyai -h localhost -f /path/to/database.sql

### Step 4: Deploy the Backend

Upload backend/ to /home/user/voyai/backend.

#Install deps:
cd /path/to/backend
npm install

#Configure .env`:
nano .env

#Content:

DATABASE_URL=postgresql://voyai_user:your_strong_password_here@localhost:5432/voyai
PORT=5000  # Changed to avoid conflicts; update if needed
JWT_SECRET=your_long_random_string
SIM_MODE=true
BOOKING_COM_API_KEY=
AIRBNB_TOKEN=

#Run with PM2:
sudo npm install -g pm2
pm2 start index.js --name voyai-backend
pm2 startup  # Follow instructions
pm2 save


### Step 5: Deploy the Frontend
Upload frontend/ to /path/to/frontend.

Update API endpoint (for VPS):
cd frontend/src
nano api.js

#Change baseURL to '/api/' (relative for proxy).

#Build:
npm install
npm run build  # Creates dist/


### Step 6: Configure Nginx as a Reverse Proxy

#Create config:
sudo nano /etc/nginx/sites-available/voyai


#Content:
server {
listen 80;
server_name your_domain_or_ip;

Serve frontend static files
root /path/to/frontend/dist;
index index.html;

location / {
try_files $uri /index.html;
}

location /api/ {
proxy_pass http://localhost:5000;  # Match backend port
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
}
}

#Enable and restart:
sudo ln -s /etc/nginx/sites-available/voyai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx


For HTTPS: Install Certbot (`sudo apt install certbot python3-certbot-nginx`), run `sudo certbot --nginx`, update server to listen 443 with ssl_certificate paths.

### Optional: Docker Deployment

Add Docker for easier setup (alternative to manual).

Create root/Dockerfile.yml (for docker-compose.yml):

version: '3'
services:
db:
image: postgres:14
environment:
POSTGRES_DB: voyai
POSTGRES_USER: voyai_user
POSTGRES_PASSWORD: your_password
volumes:

./database.sql:/docker-entrypoint-initdb.d/init.sql ports:
"5432:5432" backend: build: ./backend command: npm start ports:
"5000:5000" depends_on:
db environment: DATABASE_URL: postgresql://voyai_user:your_password@db:5432/voyai frontend: build: ./frontend command: npm run build && serve -s dist ports:
"3000:3000" depends_on:
backend


Run `docker-compose up`.

### Troubleshooting

- **502 Bad Gateway**: Check pm2 status/logs (`pm2 logs voyai-backend`). Ensure backend port matches Nginx proxy_pass.
- **API Calls Fail (404)**: Verify /api/ location in Nginx (trailing slash important). Use relative baseURL in api.js.
- **DB Connection Error**: Confirm DATABASE_URL (user/pass/host). Check `sudo systemctl status postgresql`. Edit /var/lib/postgresql/data/pg_hba.conf for local auth if needed (restart postgres).
- **Frontend Loads But No Data**: Token expired—relogin. For guest page, add public endpoints.
- **Channel Sync Fails**: In sim mode OK; for real, add keys and implement axios calls in channelService.js.
- Firewall: `sudo ufw allow 80` (http), 443 (https), 5000 (backend if direct).

