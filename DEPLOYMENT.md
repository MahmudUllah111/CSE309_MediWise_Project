# 🚀 MediWise Deployment Guide

This guide covers multiple deployment options for deploying your MediWise application live on the web.

## 📋 Table of Contents
1. [Option 1: Vercel (Frontend) + Railway (Backend) - Recommended](#option-1-vercel--railway-recommended)
2. [Option 2: Render (Full Stack)](#option-2-render-full-stack)
3. [Option 3: DigitalOcean VPS](#option-3-digitalocean-vps)
4. [Option 4: AWS EC2](#option-4-aws-ec2)

---

## Option 1: Vercel + Railway (Recommended)

**Best for:** Quick deployment with minimal server management

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your MediWise repository
   - Select the `backend` folder as the root directory

3. **Add PostgreSQL Database**
   - In Railway dashboard, click "New" → "Database" → "PostgreSQL"
   - Railway will automatically create a PostgreSQL database

4. **Configure Environment Variables**
   - Go to your backend service → "Variables" tab
   - Add these variables:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=7d
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   DB_SSL=true
   ```
   - Railway automatically provides database connection variables

5. **Deploy**
   - Railway will automatically detect Node.js and deploy
   - Wait for deployment to complete
   - Copy your backend URL (e.g., `https://your-app.up.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Set Root Directory to `frontend`

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
   ```
   Replace with your actual Railway backend URL

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - You'll get a URL like `https://your-app.vercel.app`

### Step 3: Update CORS Settings

1. **Update Backend CORS**
   - In Railway, add to environment variables:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
   - Update `backend/server.js` to use this:
   ```javascript
   app.use(cors({
     origin: process.env.CORS_ORIGIN || '*',
     credentials: true
   }));
   ```

### Step 4: Database Setup

1. **Connect to Railway PostgreSQL**
   - In Railway dashboard → PostgreSQL → "Connect"
   - Copy the connection string
   - Use a PostgreSQL client (pgAdmin, DBeaver) or Railway's built-in query editor
   - Run your database migrations or import `mediwise_db.sql` if available

---

## Option 2: Render (Full Stack)

**Best for:** Simple all-in-one deployment

### Step 1: Deploy Backend

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - Name: `mediwise-backend`
     - Root Directory: `backend`
     - Environment: Node
     - Build Command: `npm install`
     - Start Command: `npm start`

3. **Add PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Name: `mediwise-db`
   - Copy the Internal Database URL

4. **Add Environment Variables**
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=7d
   DB_HOST=<from Render PostgreSQL>
   DB_PORT=5432
   DB_NAME=<from Render PostgreSQL>
   DB_USER=<from Render PostgreSQL>
   DB_PASSWORD=<from Render PostgreSQL>
   DB_SSL=true
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Copy your backend URL (e.g., `https://mediwise-backend.onrender.com`)

### Step 2: Deploy Frontend

1. **Create Static Site**
   - Click "New" → "Static Site"
   - Connect your GitHub repository
   - Settings:
     - Name: `mediwise-frontend`
     - Root Directory: `frontend`
     - Build Command: `npm install && npm run build`
     - Publish Directory: `.next`

2. **Add Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://mediwise-backend.onrender.com
   ```

3. **Deploy**
   - Click "Create Static Site"
   - Your frontend will be available at `https://mediwise-frontend.onrender.com`

---

## Option 3: DigitalOcean VPS

**Best for:** Full control and custom configurations

### Step 1: Create Droplet

1. **Create Account**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Sign up

2. **Create Droplet**
   - Click "Create" → "Droplets"
   - Choose:
     - Image: Ubuntu 22.04 LTS
     - Plan: Basic ($12/month minimum recommended)
     - Region: Closest to your users
     - Authentication: SSH keys (recommended) or password

### Step 2: Server Setup

1. **Connect via SSH**
   ```bash
   ssh root@your_server_ip
   ```

2. **Update System**
   ```bash
   apt update && apt upgrade -y
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   node --version  # Verify installation
   ```

4. **Install PostgreSQL**
   ```bash
   apt install -y postgresql postgresql-contrib
   systemctl start postgresql
   systemctl enable postgresql
   ```

5. **Setup Database**
   ```bash
   sudo -u postgres psql
   ```
   In PostgreSQL:
   ```sql
   CREATE DATABASE mediwise;
   CREATE USER mediwise_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE mediwise TO mediwise_user;
   \q
   ```

6. **Install PM2**
   ```bash
   npm install -g pm2
   ```

7. **Install Nginx**
   ```bash
   apt install -y nginx
   systemctl start nginx
   systemctl enable nginx
   ```

### Step 3: Deploy Application

1. **Clone Repository**
   ```bash
   cd /var/www
   git clone https://github.com/your-username/your-repo.git mediwise
   cd mediwise
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install --production
   ```

3. **Create Backend .env**
   ```bash
   nano .env
   ```
   Add:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=7d
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mediwise
   DB_USER=mediwise_user
   DB_PASSWORD=your_secure_password
   DB_SSL=false
   ```

4. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

5. **Create Frontend .env.local**
   ```bash
   nano .env.local
   ```
   Add:
   ```
   NEXT_PUBLIC_API_URL=http://your_domain_or_ip:5000
   ```

### Step 4: Configure PM2

1. **Start Backend**
   ```bash
   cd /var/www/mediwise/backend
   pm2 start server.js --name mediwise-api
   pm2 save
   pm2 startup  # Follow instructions
   ```

2. **Start Frontend**
   ```bash
   cd /var/www/mediwise/frontend
   pm2 start npm --name mediwise-web -- start
   pm2 save
   ```

### Step 5: Configure Nginx

1. **Create Backend Config**
   ```bash
   nano /etc/nginx/sites-available/mediwise-api
   ```
   Add:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Create Frontend Config**
   ```bash
   nano /etc/nginx/sites-available/mediwise-web
   ```
   Add:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable Sites**
   ```bash
   ln -s /etc/nginx/sites-available/mediwise-api /etc/nginx/sites-enabled/
   ln -s /etc/nginx/sites-available/mediwise-web /etc/nginx/sites-enabled/
   nginx -t  # Test configuration
   systemctl reload nginx
   ```

### Step 6: Setup SSL (Let's Encrypt)

1. **Install Certbot**
   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. **Get SSL Certificates**
   ```bash
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   certbot --nginx -d api.yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   certbot renew --dry-run
   ```

### Step 7: Update Frontend Environment

After setting up domain, update frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Restart frontend:
```bash
pm2 restart mediwise-web
```

---

## Option 4: AWS EC2

Similar to DigitalOcean but on AWS. Follow Option 3 steps but:

1. **Create EC2 Instance**
   - Launch EC2 instance (Ubuntu 22.04)
   - Configure Security Groups:
     - Port 22 (SSH)
     - Port 80 (HTTP)
     - Port 443 (HTTPS)
     - Port 5000 (Backend - restrict to your IP if possible)
     - Port 3000 (Frontend - restrict to your IP if possible)

2. **Follow DigitalOcean steps** (Step 2-7)

3. **Use Route 53** for domain management

---

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall (UFW on Ubuntu)
- [ ] Keep dependencies updated
- [ ] Set up regular backups
- [ ] Use environment variables (never commit secrets)
- [ ] Enable database SSL in production
- [ ] Set up monitoring (PM2 monitoring, or cloud monitoring)

---

## 🔧 Post-Deployment

1. **Test Your Deployment**
   - Visit your frontend URL
   - Test login functionality
   - Verify API calls work
   - Check database connections

2. **Set Up Monitoring**
   - PM2: `pm2 monit`
   - Or use cloud monitoring services

3. **Backup Strategy**
   - Database backups: `pg_dump mediwise > backup.sql`
   - Set up automated backups

4. **Update DNS**
   - Point your domain to your server IP (VPS) or service URL (Railway/Render/Vercel)

---

## 🆘 Troubleshooting

### Backend won't start
- Check logs: `pm2 logs mediwise-api`
- Verify environment variables
- Check database connection

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings
- Verify backend is running

### Database connection errors
- Check database credentials
- Verify database is running
- Check firewall rules
- For cloud databases, verify IP whitelist

### 502 Bad Gateway
- Check if backend/frontend services are running
- Verify Nginx configuration
- Check service logs

---

## 📞 Need Help?

- Check application logs: `pm2 logs`
- Check Nginx logs: `/var/log/nginx/error.log`
- Check PostgreSQL logs: `/var/log/postgresql/`

---

## 🎉 You're Live!

Once deployed, your MediWise application will be accessible on the web. Remember to:
- Monitor performance
- Set up regular backups
- Keep dependencies updated
- Monitor error logs

Good luck with your deployment! 🚀

