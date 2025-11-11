# ЛАБС Deployment Guide

## Deployment Type: Autoscale

This application is configured for **Autoscale deployment** on Replit, which is ideal for web applications with variable traffic.

### Key Features of Autoscale:
- ✅ Automatically scales based on traffic demand
- ✅ Goes idle after 15 minutes of inactivity (no charges when idle)
- ✅ Fast startup times for instant response to requests
- ✅ Cost-effective: Only pay for compute time when serving requests

## Pre-Deployment Setup

### 1. Database Migration (One-Time Setup)

Before deploying for the first time, run the database migration to create the schema:

```bash
npm run migrate
```

This creates:
- Schema: `labs`
- Tables: `users`, `instructions`, `events`, `favorites`, `notes`, `questions`, `progress`
- Indexes for optimized queries

**Important:** Only run this once. In production, the server skips automatic database initialization for fast startup.

### 2. Environment Variables

Ensure all required secrets are set in Replit Secrets:
- `DB_HOST` - PostgreSQL server hostname
- `DB_PORT` - PostgreSQL port (5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT signing (min 32 chars)

## Deployment Configuration

The deployment is configured in `.replit`:

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["bash", "-c", "NODE_ENV=production PORT=5000 npm run server"]
```

### Build Process:
1. `npm run build` - Compiles React frontend to `./build/` directory
2. Vite optimizes assets with content hashing (e.g., `index-CWIEkLa_.js`)

### Runtime:
- Server listens on port 5000 (forwarded to port 80 externally)
- Health check at `/` responds in ~60ms
- API endpoints at `/api/*`
- Static files served from `./build/`
- Client-side routing for React SPA

## Deployment Steps

1. **Click "Deploy" button** in Replit
2. **Wait for build** to complete (~30-60 seconds)
3. **Health check passes** (server responds immediately)
4. **App goes live** with custom domain or Replit URL

## Monitoring

After deployment:
- View logs in Replit Deployments dashboard
- Monitor request counts and compute usage
- Check health status at `/` or `/api/health`

## Cost Estimation

**Autoscale Pricing:**
- Base fee: $1/month
- Compute units: $3.20 per million units
- Requests: $1.20 per million requests

**When idle:** No compute charges (server sleeps after 15 minutes)

## Troubleshooting

### Health Check Timeout
If deployment fails with health check timeout:
- Verify `NODE_ENV=production` is set
- Check server logs for errors
- Ensure port 5000 is configured
- Database should already be initialized (run `npm run migrate` once)

### Database Connection Issues
- Verify all `DB_*` secrets are set correctly
- Check database server is accessible from Replit
- Ensure `labs` schema exists (run migration)

### Slow Responses
- Check if database went idle (Neon suspends after 5 min)
- First request after idle may be slower (~1-2s)
- Consider Reserved VM if always-on performance is needed

## Development vs Production

**Development Mode:**
- Frontend: Vite dev server (port 5000)
- Backend: Express API (port 3001)
- Database auto-initializes on startup
- Hot reload enabled

**Production Mode:**
- Single Express server (port 5000)
- Serves built React app + API
- Database initialization skipped (uses existing schema)
- Fast startup for Autoscale health checks

## Need Help?

- Replit Docs: https://docs.replit.com/cloud-services/deployments/autoscale-deployments
- Deployment Dashboard: Check logs and metrics
- Database: View tables in Replit Database pane
