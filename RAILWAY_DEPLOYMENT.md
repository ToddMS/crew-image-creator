# Railway Deployment Guide for RowGram

## Prerequisites
1. Railway account with CLI installed
2. PostgreSQL database service added to your Railway project

## Environment Variables Setup

In your Railway project dashboard, add these environment variables:

### Required Variables
```bash
# Database (automatically provided by Railway when you add PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Node.js Environment
NODE_ENV=production
PORT=3000

# Application URLs
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET="your-secure-secret-key-here"
```

### Optional Variables (if using features)
```bash
# Google OAuth (if using)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# File uploads
UPLOAD_DIR="public/uploads"
MAX_FILE_SIZE="5242880"
```

## Deployment Steps

### 1. Install Railway CLI (if not already installed)
```bash
npm install -g @railway/cli
```

### 2. Login to Railway
```bash
railway login
```

### 3. Initialize and Deploy
```bash
# Link to existing project or create new one
railway link

# Add PostgreSQL database (if not already added)
railway add --database postgresql

# Set environment variables in dashboard or use CLI
railway env set NODE_ENV=production
railway env set NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}
railway env set NEXTAUTH_SECRET="your-secret-key"
railway env set DATABASE_URL=${{Postgres.DATABASE_URL}}

# Deploy
railway deploy
```

### 4. Run Database Migrations
After first deployment, run migrations:
```bash
railway run npx prisma migrate deploy
```

## What Was Fixed for Railway Deployment

1. **Fixed hardcoded localhost URL** in `src/app/providers.tsx`
   - Changed from `http://localhost:3001/api/trpc` to environment-aware URL
   - Uses `TRPC_SERVER_URL` env var for SSR and `/api/trpc` for client

2. **Created missing tRPC API handler** in `src/routes/api/trpc/$.ts`
   - TanStack Start requires explicit API route handlers
   - Set up proper tRPC fetch adapter

3. **Updated Railway configuration** in `railway.toml`
   - Set builder to use Dockerfile
   - Configured proper healthcheck and restart policy

4. **Enhanced environment configuration**
   - Updated `.env.example` with Railway-specific variables
   - Added comments for Railway reference variables

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is set to `${{Postgres.DATABASE_URL}}`
- Check that PostgreSQL service is running in Railway dashboard
- Run migrations: `railway run npx prisma migrate deploy`

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure Prisma client is generated: `railway run npx prisma generate`
- Check build logs in Railway dashboard

### Runtime Errors
- Check Railway logs: `railway logs`
- Ensure all environment variables are set
- Verify tRPC API is accessible at `/api/trpc`

## Post-Deployment Checklist
- [ ] Application loads at Railway URL
- [ ] Database connection works
- [ ] tRPC API responds at `/api/trpc`
- [ ] User authentication works (if configured)
- [ ] File uploads work (if configured)
- [ ] All features tested in production environment