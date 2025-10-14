# MCP Collection UI

A web-based user interface for browsing and managing MCP (Model Context Protocol) servers in your registry.

## Features

- 🔍 Browse registered MCP servers
- 🔐 GitHub OAuth authentication
- ➕ Register new MCP servers via UI
- 📋 Generate integration JSON for Kiro/Claude
- 🎨 Clean, modern interface
- 🔄 Real-time server list updates

## Local Development

### Prerequisites

- Python 3.11+
- MCP Registry running (locally or on Cloud Run)

### Setup

1. **Install dependencies** (optional, for .env support):
   ```bash
   pip install python-dotenv
   ```

2. **Configure environment** (optional):
   Create a `.env` file:
   ```env
   MCP_REGISTRY_URL=http://localhost:8080
   ```

3. **Run the server**:
   ```bash
   python server.py
   ```

4. **Open in browser**:
   ```
   http://localhost:5000
   ```

## Deployment to Cloud Run

### Quick Deploy

From the **MCP_Collection directory**:

```bash
cd MCP_Collection
gcloud builds submit --config cloudbuild.yaml
```

**Important:** You must run this from the MCP_Collection directory because the root `.gcloudignore` excludes the MCP_Collection folder.

Before deploying, update `cloudbuild.yaml` with your registry URL:
```yaml
substitutions:  
  _REGION: us-central1
  _REGISTRY_URL: https://your-registry-url.run.app
```

After deployment, enable public access:
```bash
gcloud run services add-iam-policy-binding mcp-collection-ui \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

For complete GCP deployment instructions, see the main [README.md](../README.md#gcp-deployment).

## Architecture

```
┌─────────────────┐
│   Browser       │
│   (User)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Python Server  │
│  (server.py)    │
│  - Serves UI    │
│  - Proxies API  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Registry   │
│  (Go Backend)   │
│  - REST API     │
│  - Database     │
└─────────────────┘
```

## Files

- `server.py` - Python HTTP server with API proxy
- `index.html` - Main UI page
- `styles.css` - Styling
- `app.js` - Frontend JavaScript
- `Dockerfile` - Container definition
- `cloudbuild.yaml` - Cloud Build configuration
- `DEPLOYMENT.md` - Deployment guide

## Configuration

### Environment Variables

- `MCP_REGISTRY_URL` - Registry backend URL (default: http://localhost:8080)
- `PORT` - Server port (default: 5000, Cloud Run sets this automatically)
- `HOST` - Bind address (default: localhost for local, 0.0.0.0 for Cloud Run)

### API Proxy

The Python server proxies requests to avoid CORS issues:

- `/api/*` → `{REGISTRY_URL}/v0/*`
- `/github/*` → `https://github.com/login/*`

## Usage

### Browse Servers

1. Open the UI in your browser
2. Click "Refresh" to load servers from the registry
3. Use the search box to filter servers
4. Click "Get Integration JSON" to see how to use a server

### Register a Server

1. Click "Login with GitHub" (required)
2. Authorize the app
3. Click "Register New MCP Server"
4. Fill in the form:
   - **Server Name**: e.g., `io.github.username/server-name`
   - **Server Title**: Display name
   - **Description**: What the server does
   - **Version**: Semantic version (e.g., 1.0.0)
   - **Server Type**: Remote or Package-based
5. Click "Generate server.json"
6. Click "Publish Now" to publish directly

### Server Types

**Remote Server (SSE/HTTP)**:
- For servers hosted at a URL
- Requires a publicly accessible endpoint
- Example: `https://api.example.com/mcp`

**Package-based (NPM/PyPI)**:
- For servers distributed as packages
- Requires package to exist in registry
- Example: `@username/package-name`

## Troubleshooting

### Can't connect to registry

Check the registry URL:
```bash
# Local
curl http://localhost:8080/v0/servers

# Cloud Run
curl https://your-registry-url/v0/servers
```

### GitHub login not working

1. Verify GitHub OAuth app is configured
2. Check callback URL matches your UI URL
3. Check browser console for errors

### Server registration fails

1. Check you're logged in with GitHub
2. Verify your namespace matches your GitHub username
3. For remote servers, ensure URL is accessible
4. For packages, ensure package exists in NPM/PyPI

### CORS errors

The UI should proxy all requests through the Python server. If you see CORS errors:
1. Ensure you're accessing the UI through the Python server (not opening index.html directly)
2. Check that `MCP_REGISTRY_URL` is set correctly

## Development

### Adding Features

1. Update `app.js` for frontend changes
2. Update `server.py` for backend/proxy changes
3. Update `styles.css` for styling
4. Test locally before deploying

### Testing

```bash
# Start local registry
docker-compose up -d

# Start UI
python server.py

# Open browser
open http://localhost:5000
```

## Production Considerations

- The UI is stateless and scales horizontally
- All data is stored in the registry backend
- Authentication tokens are stored in browser localStorage
- The Python server is lightweight and efficient

## Security

- GitHub OAuth for authentication
- JWT tokens for API access
- HTTPS enforced in production (Cloud Run)
- No sensitive data stored in UI

## Cost

When deployed to Cloud Run:
- Scales to zero when idle
- ~$0-5/month for typical usage
- No database or storage costs

## Support

For issues or questions:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md)
2. Review Cloud Run logs
3. Check the main project documentation

## License

See the main project LICENSE file.
