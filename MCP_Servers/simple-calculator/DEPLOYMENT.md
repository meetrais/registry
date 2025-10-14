# Simple Calculator MCP Server - Cloud Deployment

Deploy your simple calculator MCP server to Google Cloud Run.

## Prerequisites

- Google Cloud Project
- `gcloud` CLI installed and authenticated
- Project ID set: `gcloud config set project YOUR_PROJECT_ID`

## Deploy to Cloud Run

### Step 1: Deploy the Server

From the `MCP_Servers/simple-calculator` directory:

```bash
cd MCP_Servers/simple-calculator
gcloud builds submit --config cloudbuild.yaml
```

### Step 2: Get the Server URL

```bash
SERVER_URL=$(gcloud run services describe simple-calculator --region=us-central1 --format="value(status.url)")
echo "Server URL: $SERVER_URL"
```

Example: `https://simple-calculator-xxxxx-uc.a.run.app`

### Step 3: Test the Server

```bash
# Test the SSE endpoint
curl $SERVER_URL/sse
```

You should see SSE connection established.

## Register in Your Private Registry

### Option 1: Using the Web UI

1. **Open your Collection UI**: https://mcp-collection-ui-xxxxx-uc.a.run.app
2. **Login with GitHub**
3. **Click "Register New MCP Server"**
4. **Fill in the form:**
   - **Server Name**: `io.github.yourusername/simple-calculator`
   - **Server Title**: `Simple Calculator`
   - **Description**: `A simple calculator with basic arithmetic operations`
   - **Version**: `1.0.0`
   - **Server Type**: `Remote Server (SSE/HTTP)`
   - **Remote Type**: `sse`
   - **Server URL**: `https://simple-calculator-xxxxx-uc.a.run.app/sse`
5. **Click "Generate server.json"**
6. **Click "Publish Now"**

### Option 2: Using Publisher CLI

1. **Create server.json:**

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
  "name": "io.github.yourusername/simple-calculator",
  "title": "Simple Calculator",
  "description": "A simple calculator with basic arithmetic operations",
  "version": "1.0.0",
  "remotes": [
    {
      "type": "sse",
      "url": "https://simple-calculator-xxxxx-uc.a.run.app/sse"
    }
  ]
}
```

2. **Authenticate and publish:**

```bash
# From the simple-calculator directory
../../bin/mcp-publisher login github --registry https://mcp-registry-xxxxx-uc.a.run.app
../../bin/mcp-publisher publish --registry https://mcp-registry-xxxxx-uc.a.run.app
```

## Verify Registration

Check your registry:

```bash
curl https://mcp-registry-xxxxx-uc.a.run.app/v0/servers
```

Or visit your Collection UI to see the server listed.

## Update the Server

To update the server after making changes:

```bash
cd MCP_Servers/simple-calculator
gcloud builds submit --config cloudbuild.yaml
```

The URL stays the same, so you don't need to re-register.

## Cost Estimate

- **Cloud Run**: ~$0-2/month (scales to zero when idle)
- **Very low cost** for a simple calculator server

## Monitoring

```bash
# View logs
gcloud run services logs read simple-calculator --region=us-central1 --limit=50 --follow

# Check status
gcloud run services describe simple-calculator --region=us-central1
```

## Troubleshooting

**Server won't start:**
- Check logs: `gcloud run services logs read simple-calculator --region=us-central1 --limit=50`
- Verify dependencies are installed in Dockerfile

**Can't connect to server:**
- Ensure `--allow-unauthenticated` is set
- Check the URL includes `/sse` path
- Test with curl first

**Registration fails:**
- Disable validation: `gcloud run services update mcp-registry --region=us-central1 --set-env-vars=MCP_REGISTRY_ENABLE_REGISTRY_VALIDATION=false`
- Ensure you're logged in with GitHub
- Check namespace matches your GitHub username

## Next Steps

1. ✅ Deploy server to Cloud Run
2. ✅ Get the public URL
3. ✅ Register in your private registry
4. ✅ Use it from any MCP client!

Your calculator is now available 24/7 from anywhere! 🎉
