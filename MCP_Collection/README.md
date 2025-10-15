# MCP Collection UI

Web interface for browsing and managing MCP servers in your private registry.

## ✨ Features

- 🔍 Browse & search servers
- 🔐 GitHub OAuth login
- ➕ Register servers via UI
- 📋 Generate integration code
- 🎨 Modern, responsive design

## 🚀 Quick Start

### Local Development

```bash
# 1. Run the server
python server.py

# 2. Open browser
# http://localhost:5000
```

**Optional:** Create `.env` to customize:
```env
MCP_REGISTRY_URL=http://localhost:8080
```

## ☁️ Deploy to Cloud Run

```bash
# 1. Update cloudbuild.yaml with your registry URL
# 2. Deploy from MCP_Collection directory
cd MCP_Collection
gcloud builds submit --config cloudbuild.yaml

# 3. Enable public access
gcloud run services add-iam-policy-binding mcp-collection-ui \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

**Full guide:** [Main README](../README.md#gcp-deployment)

## 🏗️ Architecture

```
Browser → Python Server → Registry API
          (Proxy)         (Go Backend)
```

## 📁 Files

| File | Purpose |
|------|---------|
| `server.py` | HTTP server + API proxy |
| `index.html` | UI interface |
| `app.js` | Frontend logic |
| `styles.css` | Styling |
| `Dockerfile` | Container |
| `cloudbuild.yaml` | GCP deployment |

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_REGISTRY_URL` | `http://localhost:8080` | Registry backend |
| `PORT` | `5000` | Server port |
| `HOST` | `localhost` | Bind address |

## 📖 Usage

### Browse Servers
1. Open UI → Click "Refresh"
2. Search/filter servers
3. Click server → "Get Integration JSON"

### Register Server
1. Login with GitHub
2. Click "Register New MCP Server"
3. Fill form (name, title, description, version, type, URL)
4. Generate → Publish

### Server Types
- **Remote (SSE/HTTP)**: Hosted at URL
- **Package (NPM/PyPI)**: Distributed as package

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect | Check registry URL, test with curl |
| GitHub login fails | Verify OAuth app, callback URL |
| Registration fails | Check login, namespace, URL accessibility |
| CORS errors | Access via Python server, not direct file |

## 💰 Cost (Cloud Run)

- Scales to zero when idle
- ~$0-5/month typical usage
- No database costs
