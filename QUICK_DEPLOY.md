# 🚀 Quick Deploy Guide

## Fastest Way: Vercel + Railway (15 minutes)

### Backend (Railway)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo → Choose `backend` folder
4. Add PostgreSQL: Click "New" → "Database" → "PostgreSQL"
5. Add Environment Variables:
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=change_this_to_random_32_characters_minimum
   JWT_EXPIRE=7d
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   DB_SSL=true
   CORS_ORIGIN=*
   ```
6. Wait for deployment → Copy your backend URL (e.g., `https://xxx.up.railway.app`)

### Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click "Add New" → "Project" → Import your repo
3. Set Root Directory to `frontend`
4. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
   ```
5. Click "Deploy"
6. Copy your frontend URL (e.g., `https://xxx.vercel.app`)

### Final Step

1. Go back to Railway → Backend → Variables
2. Update `CORS_ORIGIN` to your Vercel frontend URL:
   ```
   CORS_ORIGIN=https://xxx.vercel.app
   ```
3. Railway will auto-redeploy

### Database Setup

1. In Railway → PostgreSQL → "Connect" → Copy connection string
2. Use a PostgreSQL client or Railway's query editor
3. Import your database schema if you have `mediwise_db.sql`

**Done!** Your app is live at your Vercel URL 🎉

---

## Alternative: Render (All-in-One)

### Backend

1. [render.com](https://render.com) → Sign up
2. "New" → "Web Service" → Connect repo
3. Settings:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
4. "New" → "PostgreSQL" → Create database
5. Add environment variables (use Render's database variables)
6. Deploy

### Frontend

1. "New" → "Static Site" → Connect repo
2. Settings:
   - Root Directory: `frontend`
   - Build: `npm install && npm run build`
   - Publish: `.next`
3. Add `NEXT_PUBLIC_API_URL` = your backend URL
4. Deploy

---

## Environment Variables Reference

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mediwise
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
CORS_ORIGIN=*
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Check `DEPLOYMENT_CHECKLIST.md` for step-by-step checklist
- Common issues:
  - **CORS errors**: Make sure CORS_ORIGIN matches frontend URL exactly
  - **Database errors**: Check credentials and SSL settings
  - **Build fails**: Verify Node.js version (18+)

