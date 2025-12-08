# Backend Setup Guide

## 🔧 Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher) - [Download PostgreSQL](https://www.postgresql.org/download/)

## 📋 Step-by-Step Setup

### 1. Install PostgreSQL

If you haven't installed PostgreSQL:
- Download from: https://www.postgresql.org/download/windows/
- During installation, remember the password you set for the `postgres` user
- Default port is `5432`

### 2. Create Database

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE mediwise;
```

Or using command line:
```bash
psql -U postgres -c "CREATE DATABASE mediwise;"
```

### 3. Configure Environment Variables

The `.env` file has been created in the `backend` folder with default values:

```
PORT=5000
NODE_ENV=development
JWT_SECRET=mediwise_secret_key_2024_please_change_in_production
JWT_EXPIRE=7d
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mediwise
DB_USER=postgres
DB_PASSWORD=postgres
FORCE_SYNC=false
```

**⚠️ IMPORTANT:** Update the `DB_PASSWORD` in `.env` to match your PostgreSQL password!

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Start the Server

```bash
npm run dev
```

The server should start on `http://localhost:5000`

## 🔍 Troubleshooting

### Error: "Database connection failed"

**Solution:**
1. Make sure PostgreSQL is running
2. Check if the database `mediwise` exists
3. Verify the password in `.env` matches your PostgreSQL password
4. Check if PostgreSQL is listening on port 5432

### Error: "JWT_SECRET is not set"

**Solution:**
- Make sure the `.env` file exists in the `backend` folder
- Check that all required environment variables are set

### Error: "Port 5000 already in use"

**Solution:**
- Change the PORT in `.env` to a different port (e.g., 5001)
- Or stop the process using port 5000

## 🚀 Quick Start (Both Servers)

From the root directory:
```bash
npm run server_client
```

This will start both backend and frontend servers together.

## 📝 Default Admin Credentials

After first run, a default admin user is created:
- **Email:** admin@mediwise.com
- **Password:** admin123

**⚠️ Change this password in production!**


