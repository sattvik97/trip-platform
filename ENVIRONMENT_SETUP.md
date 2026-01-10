# Environment Configuration Guide

This document describes how to configure the application for different environments: `local`, `test`, and `prod`.

## ⚠️ IMPORTANT WARNINGS

**Before proceeding, please read these critical warnings:**

1. **Test Mode Uses Production Database**: 
   - Test environment (`ENV=test`) uses the **SAME Azure PostgreSQL database as production**
   - Any database changes in test mode will **directly affect production data**
   - Use test mode only for pre-production testing with extreme caution
   - The application will log a clear warning on startup when running in test mode

2. **Production Environment Variables**:
   - In production (`ENV=prod`), `.env` files are **NOT loaded**
   - All configuration must come from environment variables set in Azure App Service
   - Never commit `.env` files with real secrets to version control

3. **Environment Switching**:
   - Test mode must be explicitly enabled via `ENV=test`
   - Always verify your current environment using startup logs before making changes

## Overview

The application supports three environments:
- **local**: Full local development (local DB, local filesystem storage)
- **test**: Pre-production testing (local backend, Azure DB, Azure Blob Storage) - ⚠️ **Uses production database**
- **prod**: Production (Azure App Service, Azure DB, Azure Blob Storage)

## Quick Start

1. **Backend**: Copy the appropriate `.env.*.example` file to `.env` in the `backend/` directory
2. **Frontend**: Copy the appropriate `.env.*.example` file to `.env.local`, `.env.test`, or `.env.production` in the `frontend/` directory
3. **Set ENV**: Set the `ENV` environment variable or in your `.env` file to switch environments

## Backend Configuration

### Environment Files

Example environment files are provided in the `backend/` directory:
- `backend/.env.local.example` - Local development
- `backend/.env.test.example` - Test environment (uses Azure DB)
- `backend/.env.prod.example` - Production reference (not loaded, use Azure App Service config)

**⚠️ IMPORTANT**: 
- Copy the appropriate example file to `.env` (e.g., `cp .env.local.example .env`)
- Never commit `.env` files with real secrets
- In production (`ENV=prod`), `.env` files are **NOT loaded** - use Azure App Service Configuration instead

### Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Environment: local | test | prod
ENV=local

# Database Configuration
# Local: postgresql://trip:trip@localhost:5432/tripdb
# Test/Prod: Your Azure PostgreSQL connection string
DATABASE_URL=postgresql://trip:trip@localhost:5432/tripdb

# JWT Configuration
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24

# Azure Blob Storage Configuration (required for test/prod)
# Leave empty for local environment
BLOB_CONNECTION_STRING=
BLOB_CONTAINER=trip-images

# Local Storage Configuration (only used in local environment)
LOCAL_UPLOAD_DIR=media

# CORS Configuration
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Environment-Specific Notes

#### Local Environment (`ENV=local`)
- Backend runs locally on `http://localhost:8000`
- Uses local PostgreSQL database
- Images stored in local filesystem (`media/` directory)
- `.env` file is loaded (if present)

#### Test Environment (`ENV=test`)
- Backend runs locally (but uses Azure services)
- Uses Azure PostgreSQL database (**⚠️ SAME DATABASE AS PRODUCTION**)
- Images stored in Azure Blob Storage
- `.env` file is loaded (if present)
- **⚠️ CRITICAL WARNING**: 
  - Must be explicitly enabled via `ENV=test`
  - Uses the **SAME database as production** - any changes will affect production data
  - Use with extreme caution for pre-production testing only
  - A clear warning is logged at startup: `"WARNING: Running in TEST mode against Azure database"`

#### Production Environment (`ENV=prod`)
- Backend runs on Azure App Service
- Uses Azure PostgreSQL database
- Images stored in Azure Blob Storage
- **No `.env` file is loaded** - all configuration must come from environment variables
- Set environment variables in Azure App Service Configuration

## Frontend Configuration

### Environment Variables

For Next.js, environment variables prefixed with `NEXT_PUBLIC_` are available in the browser.

#### Local Development (`.env.local`)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### Test Environment (`.env.test`)
```bash
# Backend runs locally but uses Azure DB
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### Production (`.env.production`)
```bash
# Replace with your actual Azure App Service URL
NEXT_PUBLIC_API_BASE_URL=https://your-backend-app.azurewebsites.net
```

### Building for Different Environments

```bash
# Local development (default)
npm run dev

# Build for test environment
ENV=test npm run build

# Build for production
npm run build
```

In production, set `NEXT_PUBLIC_API_BASE_URL` as an environment variable in your deployment platform (Azure Static Web Apps).

## Storage Backend Behavior

### Local Environment
- Images are saved to `backend/media/trips/{trip_id}/`
- Images are served via `/media/trips/{trip_id}/{filename}` endpoint
- No Azure dependencies required

### Test/Production Environments
- Images are uploaded to Azure Blob Storage
- Images are served via Azure Blob Storage public URLs
- Requires `BLOB_CONNECTION_STRING` and `BLOB_CONTAINER` to be set
- Azure Storage SDK (`azure-storage-blob`) is required

## Database Configuration

### Local
```bash
DATABASE_URL=postgresql://trip:trip@localhost:5432/tripdb
```

### Test/Production (Azure PostgreSQL)
```bash
DATABASE_URL=postgresql://username:password@your-server.postgres.database.azure.com:5432/dbname?sslmode=require
```

## Switching Environments

### Backend

To switch environments, set the `ENV` environment variable:

**Option 1: In `.env` file** (local/test only)
```bash
ENV=local  # or test, or prod
```

**Option 2: As environment variable** (recommended for test/prod)
```bash
# Windows PowerShell
$env:ENV="test"

# Linux/Mac
export ENV=test
```

**⚠️ Important Notes:**
- For production (`ENV=prod`), `.env` files are **NOT loaded** - you must use environment variables
- When `ENV=prod`, all configuration must come from environment variables set in Azure App Service
- Test mode (`ENV=test`) will log a clear warning on startup about using production database

### Frontend

To switch environments, create or update the appropriate `.env.*` file:

```bash
# Local development
cp .env.local.example .env.local

# Test environment
cp .env.test.example .env.test

# Production build
cp .env.production.example .env.production
```

Or set `NEXT_PUBLIC_API_BASE_URL` as an environment variable in your deployment platform.

## Startup Safety Logs

The backend application logs environment-specific warnings and information at startup:

**Test Mode (`ENV=test`):**
```
================================================================================
WARNING: Running in TEST mode against Azure database
This mode uses Azure PostgreSQL (same as production)
Any database changes will affect production data
================================================================================
Storage: Azure Blob Storage (container: trip-images)
```

**Production Mode (`ENV=prod`):**
```
================================================================================
Running in PROD mode
All configuration loaded from environment variables
================================================================================
Storage: Azure Blob Storage (container: trip-images)
```

**Local Mode (`ENV=local`):**
```
Running in LOCAL mode (ENV=local)
Storage: Local filesystem (directory: media)
```

## Azure App Service Configuration

For production deployment on Azure App Service, set the following environment variables in Azure Portal:

1. Go to **Azure Portal** → Your App Service → **Configuration** → **Application settings**
2. Add the following variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `ENV` | `prod` | Environment identifier |
| `DATABASE_URL` | `postgresql://...` | Azure PostgreSQL connection string |
| `SECRET_KEY` | `your-secret-key` | JWT signing secret (use strong random string) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_HOURS` | `24` | Token expiration hours |
| `BLOB_CONNECTION_STRING` | `DefaultEndpointsProtocol=...` | Azure Storage connection string |
| `BLOB_CONTAINER` | `trip-images` | Blob container name |
| `CORS_ORIGINS` | `https://your-frontend.azurestaticapps.net` | Allowed frontend origins (comma-separated) |

**⚠️ Important:**
- Never commit these values to version control
- Use Azure Key Vault for sensitive values in production
- `.env` files are **NOT loaded** in production - only environment variables are used

## Verification

### Check Current Environment

The application logs will indicate the current environment at startup. You can also check programmatically:

**Backend:**
```python
from app.core.config import settings
print(f"Environment: {settings.ENV}")
print(f"Uses Azure Storage: {settings.uses_azure_storage}")
print(f"Uses Local Storage: {settings.uses_local_storage}")
```

**Frontend:**
Check browser console or inspect `process.env.NEXT_PUBLIC_API_BASE_URL` (only available in browser, not in Node.js runtime).

## Important Notes

1. **No Hardcoded URLs**: All URLs are configured via environment variables
2. **Production Safety**: In prod, `.env` files are NOT loaded - only environment variables
3. **Test Environment Warning**: 
   - Test environment is explicitly opt-in via `ENV=test`
   - **Uses the SAME database as production** - changes affect production data
   - Clear warning is logged at startup when `ENV=test`
   - Use only for pre-production testing with extreme caution
4. **CORS Configuration**: Must include all allowed frontend origins (comma-separated)
5. **Secrets Management**: 
   - Never commit `.env` files with real secrets to version control
   - Use Azure Key Vault for sensitive values in production
   - Example files (`.env.*.example`) are safe to commit as they contain no secrets

## Troubleshooting

### Backend can't connect to database
- Check `DATABASE_URL` is correct for your environment
- For Azure: Ensure SSL mode is required (`?sslmode=require`)
- For local: Ensure PostgreSQL is running and accessible

### Images not uploading (test/prod)
- Verify `BLOB_CONNECTION_STRING` is set correctly
- Check `BLOB_CONTAINER` exists in Azure Storage Account
- Ensure Azure Storage SDK is installed: `pip install azure-storage-blob`

### Frontend can't reach backend
- Verify `NEXT_PUBLIC_API_BASE_URL` matches your backend URL
- Check CORS configuration includes your frontend origin
- Ensure backend is running and accessible

### Storage backend not switching
- Verify `ENV` variable is set correctly
- Check that `BLOB_CONNECTION_STRING` is provided for test/prod
- For local: Ensure `LOCAL_UPLOAD_DIR` is writable

