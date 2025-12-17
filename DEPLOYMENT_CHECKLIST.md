# ✅ Deployment Checklist

Use this checklist to ensure a smooth deployment.

## Pre-Deployment

### Backend Setup
- [ ] Database created and accessible
- [ ] Backend `.env` file configured with production values
- [ ] JWT_SECRET changed from default
- [ ] Database credentials verified
- [ ] SSL enabled for database connection (if using cloud DB)
- [ ] CORS_ORIGIN or FRONTEND_URL set to your frontend domain

### Frontend Setup
- [ ] Frontend `.env.local` file created
- [ ] `NEXT_PUBLIC_API_URL` points to your backend URL
- [ ] Frontend builds successfully (`npm run build`)

### Code Preparation
- [ ] All sensitive data removed from code
- [ ] No hardcoded credentials
- [ ] Error handling tested
- [ ] API endpoints tested locally

## Deployment Steps

### Option 1: Vercel + Railway
- [ ] Railway account created
- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created on Railway
- [ ] Environment variables set in Railway
- [ ] Backend URL copied
- [ ] Vercel account created
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] CORS updated in backend

### Option 2: Render
- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Backend web service created
- [ ] Environment variables configured
- [ ] Frontend static site created
- [ ] Environment variables set

### Option 3: VPS (DigitalOcean/AWS)
- [ ] Server created
- [ ] Node.js installed
- [ ] PostgreSQL installed and configured
- [ ] PM2 installed
- [ ] Nginx installed and configured
- [ ] SSL certificates installed (Let's Encrypt)
- [ ] Firewall configured
- [ ] Application deployed
- [ ] Services running via PM2

## Post-Deployment

### Testing
- [ ] Frontend loads correctly
- [ ] Backend API responds (`/api/health`)
- [ ] User registration works
- [ ] User login works
- [ ] Database operations work
- [ ] File uploads work (if applicable)
- [ ] All major features tested

### Security
- [ ] HTTPS enabled
- [ ] Default admin password changed
- [ ] Strong JWT_SECRET in use
- [ ] Database credentials secure
- [ ] CORS properly configured
- [ ] Environment variables not exposed

### Monitoring
- [ ] Logs accessible
- [ ] Error tracking set up (optional)
- [ ] Uptime monitoring configured (optional)
- [ ] Backup strategy in place

## Quick Commands Reference

### PM2 (VPS)
```bash
pm2 start backend/server.js --name mediwise-api
pm2 start "npm run start" --name mediwise-web --cwd frontend
pm2 logs
pm2 restart all
pm2 status
```

### Database Backup
```bash
pg_dump -U mediwise_user mediwise > backup_$(date +%Y%m%d).sql
```

### Check Services
```bash
# Check if services are running
pm2 status
systemctl status nginx
systemctl status postgresql

# Check logs
pm2 logs mediwise-api
pm2 logs mediwise-web
tail -f /var/log/nginx/error.log
```

## Common Issues

- **502 Bad Gateway**: Check if backend/frontend services are running
- **CORS errors**: Verify CORS_ORIGIN matches frontend URL exactly
- **Database connection**: Check credentials and network access
- **Build failures**: Check Node.js version compatibility

