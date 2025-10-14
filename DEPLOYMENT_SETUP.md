# Cloud Run Deployment Setup Guide

This guide explains how to set up the necessary Google Cloud resources before deploying the MCP Registry to Cloud Run.

## Prerequisites

- Google Cloud Project created (`mcp-private-registry`)
- `gcloud` CLI installed and authenticated
- Project ID: `mcp-private-registry`

## Step 1: Create Cloud SQL Instance

Create a PostgreSQL instance for the registry:

```bash
gcloud sql instances create mcp-registry-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=YOUR_ROOT_PASSWORD
```

## Step 2: Create Database and User

```bash
# Create the database
gcloud sql databases create mcp-registry \
    --instance=mcp-registry-db

# Create user (you'll be prompted for password)
gcloud sql users create mcpregistry \
    --instance=mcp-registry-db \
    --password=YOUR_DB_PASSWORD
```

## Step 3: Create Secret Manager Secrets

The deployment requires three secrets to be created in Google Secret Manager:

### 3.1 Database URL Secret

Create the PostgreSQL connection URL secret:

```bash
# Format: postgres://username:password@/database?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
# Replace YOUR_DB_PASSWORD with the password you set in Step 2
DB_URL="postgres://mcpregistry:YOUR_DB_PASSWORD@/mcp-registry?host=/cloudsql/mcp-private-registry:us-central1:mcp-registry-db"

# Store it in Secret Manager
echo -n "$DB_URL" | gcloud secrets create database-url --data-file=-
```

### 3.2 GitHub Client Secret (Optional - for GitHub OAuth)

```bash
# Store your GitHub OAuth app client secret
# If not using GitHub OAuth, you can skip this or set anonymous auth to true
echo -n "YOUR_GITHUB_CLIENT_SECRET" | gcloud secrets create github-client-secret --data-file=-
echo -n "YOUR_GITHUB_CLIENT_ID" | gcloud secrets create github-client-id --data-file=-
```

### 3.3 JWT Private Key

Generate and store a JWT private key:

```bash
# Generate a 32-byte random hex string for JWT signing
JWT_KEY=$(openssl rand -hex 32)

# Store it in Secret Manager
echo -n "$JWT_KEY" | gcloud secrets create jwt-private-key --data-file=-
```

## Step 4: Grant Cloud Run Access to Secrets

Allow Cloud Run to access the secrets:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe mcp-private-registry --format="value(projectNumber)")

# Grant access to database-url (REQUIRED)
gcloud secrets add-iam-policy-binding database-url \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Grant access to jwt-private-key (REQUIRED)
gcloud secrets add-iam-policy-binding jwt-private-key \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Grant access to github-client-secret (Optional - only if using GitHub OAuth)
gcloud secrets add-iam-policy-binding github-client-secret \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Grant access to github-client-id (Optional - only if using GitHub OAuth)
gcloud secrets add-iam-policy-binding github-client-id \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Step 5: Enable Required APIs

```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com
```

## Step 6: Verify cloudbuild.yaml Configuration

Verify the `cloudbuild.yaml` substitutions section matches your setup:

```yaml
substitutions:
  _REGION: us-central1
  _CLOUDSQL_INSTANCE: mcp-private-registry:us-central1:mcp-registry-db
```

**Note:** Database credentials and other sensitive values are now stored in Secret Manager and referenced via `--update-secrets` flags in the deployment step. You don't need to modify the substitutions unless you're using a different region or Cloud SQL instance name.

## Step 7: Deploy

Now you can deploy using Cloud Build:

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Verification

After deployment, verify the service is running:

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe mcp-registry --region=us-central1 --format="value(status.url)")

# Test the API
curl $SERVICE_URL/v0/servers
```

You should see a JSON response with an empty server list:
```json
{"servers":[],"metadata":{"count":0}}
```

## Troubleshooting

### Check Cloud Run Logs
```bash
gcloud run services logs read mcp-registry --region=us-central1 --limit=50
```

### Check Cloud SQL Connection
```bash
gcloud sql instances describe mcp-registry-db
```

### Verify Secrets
```bash
# List all secrets to ensure they exist
gcloud secrets list

# Verify database-url secret exists (don't print the value as it contains sensitive data)
gcloud secrets describe database-url

# Verify jwt-private-key secret exists
gcloud secrets describe jwt-private-key

# If using GitHub OAuth, verify these exist
gcloud secrets describe github-client-secret
gcloud secrets describe github-client-id
```

### Common Issues

1. **"failed to start and listen on port"**
   - Check that PORT environment variable is set (Cloud Run sets this automatically)
   - Verify the application is binding to `:8080`

2. **Database connection errors**
   - Verify Cloud SQL instance is running
   - Check database credentials in substitutions
   - Ensure Cloud Run has Cloud SQL Client role

3. **Secret access denied**
   - Verify Secret Manager IAM permissions (see Step 4)
   - Ensure all required secrets exist: `database-url`, `jwt-private-key`
   - Verify compute service account has secretAccessor role
   
4. **Container import failed / Revision not ready**
   - Usually caused by missing `database-url` secret
   - Check Cloud Run logs for specific error: `gcloud run services logs read mcp-registry --region=us-central1 --limit=50`
   - Verify database connection string format in the secret

## Security Notes

- Never commit database passwords or secrets to version control
- Use Secret Manager for all sensitive values
- Consider using Cloud SQL Auth Proxy for enhanced security
- Enable VPC connector for private networking (optional)

## Cost Optimization

The current configuration uses:
- Cloud SQL `db-f1-micro` tier (low cost, suitable for development)
- Cloud Run with 1-10 instances (scales to zero when not in use)
- 2 CPU, 1GB memory per instance

For production, consider:
- Upgrading Cloud SQL tier for better performance
- Adjusting min/max instances based on traffic
- Implementing proper backup and high availability

## Next Steps

After successful deployment:
1. Configure your GitHub OAuth app's callback URL to point to your Cloud Run service
2. Test publishing a server using the `mcp-publisher` CLI
3. Set up monitoring and alerting
4. Configure custom domain (optional)
