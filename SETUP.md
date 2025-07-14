# VPS Deployment Guide for VoyAI

This guide provides step-by-step instructions to deploy the VoyAI application on a standard Linux VPS (e.g., Ubuntu 22.04).

**Prerequisites:**
*   A VPS with root or sudo access.
*   A domain name pointed at your VPS's IP address (optional, for HTTPS).
*   All the project files (`backend`, `frontend`, `database.sql`) ready to be uploaded.

---

### Step 1: Initial Server Setup

Connect to your VPS via SSH.

ssh root@your_vps_ip

First, update your server's package lists.

sudo apt update && sudo apt upgrade -y

Step 2: Install Dependencies (Node.js, PostgreSQL, Nginx)
Install Node.js (v20):
We'll use NodeSource to get a modern version of Node.js.

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

Install PostgreSQL:

sudo apt install -y postgresql postgresql-contrib

Install Nginx (Web Server):
Nginx will act as a reverse proxy, directing traffic to our backend and serving the frontend.

sudo apt install -y nginx

Step 3: Set Up the PostgreSQL Database
Start and enable PostgreSQL:

sudo systemctl start postgresql
sudo systemctl enable postgresql

Create the database and user:
Log in to the default postgres user.

sudo -u postgres psql

Inside the PostgreSQL prompt, run these commands:

-- Create a dedicated user for your app (use a strong password!)
CREATE USER voyai_user WITH PASSWORD 'your_strong_password_here';

-- Create the database
CREATE DATABASE voyai;

-- Grant all privileges on the new database to your new user
GRANT ALL PRIVILEGES ON DATABASE voyai TO voyai_user;

-- Exit the psql prompt
\q

Import the schema:
Upload the database.sql file to your VPS (e.g., using scp). Then, from your regular shell, run:

psql -U voyai_user -d voyai -h localhost -f path/to/your/database.sql

You will be prompted for the password you created.
Step 4: Deploy the Backend
Upload Files:
Upload the entire backend directory to your VPS (e.g., into /home/user/voyai/backend).
Install Dependencies:
Navigate to the backend directory and install the packages.

cd /path/to/your/backend
npm install


Configure Environment:
Create the .env file.

nano .env

Add the following content, replacing the placeholders. Crucially, use localhost for the database host.

DATABASE_URL=postgresql://voyai_user:your_strong_password_here@localhost:5432/voyai
PORT=5000
JWT_SECRET=generate_a_very_long_random_secret_string_here
SIM_MODE=true
# Add real API keys if you want to use them
BOOKING_COM_API_KEY=
AIRBNB_TOKEN=

Run as a Service with PM2:
PM2 is a process manager that will keep your Node.js app running forever and restart it if it crashes.

sudo npm install pm2 -g
pm2 start index.js --name voyai-backend
pm2 startup # Follow the instructions to enable on reboot
pm2 save
Use code with caution.

Step 5: Deploy the Frontend
Upload Files:
Upload the entire frontend directory to your VPS (e.g., into /home/user/voyai/frontend).
Update API Endpoint:
In the frontend code, you must change the API URL from localhost to your server's domain or IP.

cd /path/to/your/frontend
nano src/api.js

Change http://localhost:5000/api to http://your_vps_ip:5000/api (or /api if using the Nginx proxy correctly). For the best setup, just use /api.

// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Use a relative path for the proxy
});
// ... rest of the file

Build the Static Files:

npm install
npm run build

This creates a dist directory with optimized, static HTML, CSS, and JS files.

##Step 6: Configure Nginx as a Reverse Proxy
Create a new Nginx configuration file:

sudo nano /etc/nginx/sites-available/voyai


Paste the following configuration:
This tells Nginx to serve the static frontend files and forward any requests starting with /api to your backend server running on port 5000.

server {
    listen 80;
    server_name your_domain_or_ip; # e.g., voyai.example.com or your VPS IP

    # Path to the built frontend files
    root /path/to/your/frontend/dist;
    index index.html;

    location / {
        # Fallback to index.html for single-page applications (React Router)
        try_files $uri /index.html;
    }

    location /api/ {
        # Forward API requests to the backend Node.js server
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

Enable the site and restart Nginx:

# Link the config to make it active
sudo ln -s /etc/nginx/sites-available/voyai /etc/nginx/sites-enabled/

# Test for syntax errors
sudo nginx -t

# Restart Nginx to apply changes
sudo systemctl restart nginx

Your application should now be accessible at http://your_domain_or_ip.
Obvious Troubleshooting Steps
502 Bad Gateway Error: This usually means Nginx can't communicate with your backend.
Check if the backend is running: pm2 status. If it has errored, check the logs: pm2 logs voyai-backend.
Ensure the PORT in backend/.env is 5000 and matches the proxy_pass port in the Nginx config.
Check your firewall. sudo ufw status. If active, ensure it allows traffic on port 5000.
Frontend Loads but API Calls Fail (404 Not Found):
Double-check the location /api/ block in your Nginx config. A missing trailing slash can cause issues.
Ensure you updated the baseURL in frontend/src/api.js to be a relative path (/api).
Database Connection Error (Backend Logs):
Verify the DATABASE_URL in backend/.env is 100% correct (user, password, host, database name).
Ensure PostgreSQL is running: sudo systemctl status postgresql.
Check PostgreSQL's authentication methods in pg_hba.conf if you have connection issues from localhost. The default setup should work.