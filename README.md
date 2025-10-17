# Private MCP Registry

Self-hosted registry for [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers. Run your own private catalog with full control.

## 🎯 What You Get

- 🏠 **Private hosting** - Keep everything internal
- 🔐 **Secure auth** - GitHub OAuth, DNS, HTTP, or anonymous
- 🌐 **Web UI** - Browse and manage servers visually
- 📦 **Multi-package** - NPM, PyPI, Docker, remote servers
- ☁️ **Cloud ready** - Deploy to GCP in minutes
- 🔧 **Easy publishing** - CLI tool included

**What is MCP?** An open standard enabling AI assistants to connect to external tools and data sources.

## 🏗️ Architecture
<img width="1140" height="647" alt="image" src="https://github.com/user-attachments/assets/60421d2a-649e-449b-a1f6-162838e163bb" />

### Components

| Component | Purpose | Tech | Port |
|-----------|---------|------|------|
| Registry API | Backend service | Go | 8080 |
| PostgreSQL | Data storage | PostgreSQL 16 | 5432 |
| Collection UI | Web interface | Python/JS | 5000 |
| Publisher CLI | Publishing tool | Go | - |

### Project Structure

```
registry/
├── cmd/                   # CLI tools
├── internal/              # Go backend
├── MCP_Collection/        # Web UI
├── MCP_Servers/           # Example servers
└── MCP_Client/            # Test client
├── docs/                  # Documentation
├── docker-compose.yml     # Local development setup
└── cloudbuild.yaml        # GCP deployment config
```

## 🚀 Quick Start

Get your private MCP registry running in 5 minutes.

### Prerequisites

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Docker Desktop** | Latest | Run registry and database |
| **Go** | 1.24+ | Build publisher CLI |
| **Python** | 3.11+ | Run web UI (optional) |
| **Git** | Any | Clone repository |

### Local Setup

#### 1. Clone and Start

```bash
# Clone the repository
git clone https://github.com/meetrais/registry.git
cd registry

# Start the registry with Docker Compose
docker compose up -d
```

This starts:
- ✅ **Registry API** at `http://localhost:8080`
- ✅ **PostgreSQL database** for server metadata

#### 2. Verify Registry

```bash
curl http://localhost:8080/v0/servers
```

Expected response (empty registry):
```json
{"servers":[],"metadata":{"count":0}}
```

#### 3. Build Publisher CLI

**Windows:**
```powershell
go build -o bin/mcp-publisher.exe ./cmd/publisher
```

**macOS/Linux:**
```bash
go build -o bin/mcp-publisher ./cmd/publisher
```

**Verify:**
```bash
./bin/mcp-publisher --help
```

#### 4. Start Web UI (Optional)

```bash
cd MCP_Collection
python server.py
# Visit http://localhost:5000
```

### What's Running

| Service | URL | Purpose |
|---------|-----|---------|
| Registry API | :8080 | REST API |
| Web UI | :5000 | Browse/manage |
| PostgreSQL | :5432 | Database |
| API Docs | :8080/docs | Documentation |

## 💡 Try the Sample Server

Includes a calculator server in `MCP_Servers/simple-calculator/`.

### Quick Test

```bash
# 1. Install & run
pip install fastmcp uvicorn
python MCP_Servers/simple-calculator/server.py

# 2. Generate metadata
cd MCP_Servers/simple-calculator
../../bin/mcp-publisher init

# 3. Edit server.json (update yourusername)
{
  "name": "io.github.yourusername/simple-calculator",
  "title": "Simple Calculator",
  "version": "1.0.0",
  "remotes": [{"type": "sse", "url": "http://localhost:3000/sse"}]
}

# 4. Publish
../../bin/mcp-publisher login github --registry http://localhost:8080
../../bin/mcp-publisher publish --registry http://localhost:8080

# 5. Verify
```bash
curl http://localhost:8080/v0/servers
```

**7. Browse your registry (optional):**

For a better viewing experience, use the included web UI:
```bash
cd MCP_Collection
python server.py
```

Visit **http://localhost:5000** to see your servers in a visual interface with search, statistics, and metadata display.

---

## 📤 Publishing Servers

### 1. Create server.json

```bash
cd your-server-directory
/path/to/bin/mcp-publisher init
```

Edit the generated file:
```json
{
  "name": "io.github.yourname/server-name",
  "title": "Server Title",
  "description": "What it does",
  "version": "1.0.0",
  "remotes": [{"type": "sse", "url": "https://your-url/sse"}]
}
```

### 2. Authenticate

Choose based on your namespace:

| Method | Namespace | Command |
|--------|-----------|---------|
| **GitHub** (Recommended) | `io.github.username/*` | `./bin/mcp-publisher login github --registry URL` |
| **DNS** | `com.company/*` | `./bin/mcp-publisher login dns --domain company.com --private-key KEY --registry URL` |
| **HTTP** | `com.company/*` | `./bin/mcp-publisher login http --domain company.com --private-key KEY --registry URL` |
| **Anonymous** (Testing) | `io.modelcontextprotocol.anonymous/*` | `./bin/mcp-publisher login none --registry URL` |

**GitHub OAuth** (easiest):
- Opens browser for authentication
- Namespace must match your GitHub username
- Example: `io.github.johndoe/my-server`

**DNS/HTTP** (for custom domains):
- Requires domain ownership verification
- Generate Ed25519 key pair
- Add TXT record (DNS) or file (HTTP)

**Anonymous** (testing only):
- Enable in `.env`: `MCP_REGISTRY_ENABLE_ANONYMOUS_AUTH=true`
- Restart: `docker compose restart registry`

### 3. Publish

```bash
./bin/mcp-publisher publish --registry http://localhost:8080
```

### 4. Verify

```bash
curl http://localhost:8080/v0/servers
```

## 📦 Supported Types

- NPM, PyPI, NuGet packages
- Docker/OCI images
- Remote servers (HTTP/SSE)
- MCPB packages

## ⚙️ Configuration

### Environment Variables

Configure the registry via `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_REGISTRY_SERVER_ADDRESS` | `:8080` | Server bind address |
| `MCP_REGISTRY_DATABASE_URL` | `postgres://...` | PostgreSQL connection string |
| `MCP_REGISTRY_SEED_FROM` | `` | Public registry URL (empty for private) |
| `MCP_REGISTRY_GITHUB_CLIENT_ID` | - | GitHub OAuth client ID |
| `MCP_REGISTRY_GITHUB_CLIENT_SECRET` | - | GitHub OAuth client secret |
| `MCP_REGISTRY_ENABLE_ANONYMOUS_AUTH` | `false` | Allow anonymous publishing |
| `MCP_REGISTRY_ENABLE_REGISTRY_VALIDATION` | `true` | Validate package existence |
| `MCP_REGISTRY_JWT_PRIVATE_KEY` | - | JWT signing key (32-byte hex) |

### Docker Compose

The `docker-compose.yml` is pre-configured for private use:
- ✅ No public server seeding
- ✅ PostgreSQL with persistent storage
- ✅ Registry API on port 8080
- ✅ Health checks enabled

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v0/servers` | GET | List all servers |
| `/v0/servers?search=keyword` | GET | Search servers |
| `/v0/servers/{name}/versions/{version}` | GET | Get specific server |
| `/v0/publish` | POST | Publish a server (auth required) |
| `/v0/ping` | GET | Health check |
| `/v0/health` | GET | Detailed health status |
| `/docs` | GET | Interactive API documentation |

## 🔄 Private vs Public Registry

| Feature | Private Registry (This) | Public Registry |
|---------|------------------------|-----------------|
| **Server Catalog** | Empty by default | Pre-seeded with public servers |
| **Access Control** | You control everything | Open to public |
| **Hosting** | Self-hosted (local/cloud) | Hosted by Anthropic |
| **Authentication** | GitHub, DNS, HTTP, Anonymous | GitHub only |
| **Data Privacy** | Completely private | Public catalog |
| **Customization** | Full control | Limited |
| **Cost** | $0 (local) or ~$5-25/month (cloud) | Free |
| **Use Case** | Private/corporate use | Public sharing |

**Key Configuration Difference:**
```bash
# Private Registry (this project)
MCP_REGISTRY_SEED_FROM=

# Public Registry
MCP_REGISTRY_SEED_FROM=https://registry.modelcontextprotocol.io/v0/servers
```

## 📁 Project Directories

| Directory | Purpose | Documentation |
|-----------|---------|---------------|
| `MCP_Servers/` | Example MCP servers and templates | [README](MCP_Servers/README.md) |
| `MCP_Collection/` | Web UI for browsing registry | [README](MCP_Collection/README.md) |
| `MCP_Client/` | AI-powered test client | [README](MCP_Client/README.md) |
| `cmd/` | CLI tools (publisher, registry) | - |
| `internal/` | Go backend implementation | - |
| `docs/` | Detailed documentation | - |
| `deploy/` | Deployment configurations | - |

## 🔑 Key Features

### Private by Default
- ✅ **Starts empty** - No public servers seeded
- ✅ **Local first** - Runs on localhost by default
- ✅ **Full control** - You manage all published servers
- ✅ **No external dependencies** - Completely self-contained

### Authentication & Security
- 🔐 **GitHub OAuth** - Authenticate with your GitHub account
- 🌐 **DNS Verification** - Prove domain ownership via DNS records
- 📄 **HTTP Verification** - Verify domain via web file
- 🧪 **Anonymous Mode** - For testing (disable in production)
- 🔒 **Namespace-based Authorization** - Granular access control

### Package Support
- 📦 **NPM** - Node.js packages
- 🐍 **PyPI** - Python packages
- 📋 **NuGet** - .NET packages
- 🐳 **OCI/Docker** - Container images
- 📁 **MCPB** - MCP binary packages
- 🌐 **Remote Servers** - HTTP/SSE hosted services

### Developer Experience
- 🖥️ **Web UI** - Beautiful interface for browsing servers
- 🛠️ **CLI Tool** - Easy publishing workflow
- 📚 **API Documentation** - Interactive docs at `/docs`
- 🔍 **Search & Filter** - Find servers quickly
- 📊 **Metadata Display** - Rich server information

### Production Ready
- ☁️ **Cloud Deployment** - One-command deploy to GCP
- 📈 **Auto-scaling** - Scales with demand
- 🔄 **High Availability** - Managed database
- 📝 **Comprehensive Logging** - Full observability
- 💰 **Cost Effective** - ~$5-25/month on GCP

## ☁️ GCP Deployment

Deploy to Google Cloud Run with managed PostgreSQL.

### Setup (One-time)

```bash
# 1. Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com

# 2. Create database
gcloud sql instances create mcp-registry-db --database-version=POSTGRES_15 --tier=db-f1-micro --region=us-central1
gcloud sql databases create mcp-registry --instance=mcp-registry-db
gcloud sql users create mcpregistry --instance=mcp-registry-db --password=YOUR_PASSWORD

# 3. Create secrets
echo -n "postgres://mcpregistry:PASSWORD@/mcp-registry?host=/cloudsql/PROJECT:us-central1:mcp-registry-db" | gcloud secrets create database-url --data-file=-
echo -n "$(openssl rand -hex 32)" | gcloud secrets create jwt-private-key --data-file=-

# 4. Grant permissions
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format="value(projectNumber)")
for SECRET in database-url jwt-private-key; do
  gcloud secrets add-iam-policy-binding $SECRET --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
done
```

### Deploy

```bash
# Registry
gcloud builds submit --config cloudbuild.yaml

# UI (from MCP_Collection directory)
cd MCP_Collection
gcloud builds submit --config cloudbuild.yaml

# Enable public access
gcloud run services add-iam-policy-binding mcp-collection-ui --region=us-central1 --member="allUsers" --role="roles/run.invoker"
```

### Result

- **Registry**: `https://mcp-registry-xxxxx.run.app` (Auto-scales 1-10)
- **UI**: `https://mcp-collection-ui-xxxxx.run.app` (Scales to zero)
- **Cost**: ~$5-25/month

**Full guide:** [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md)

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Registry won't start | Check Cloud SQL, secrets, logs |
| UI deployment fails | Run from `MCP_Collection` dir, check URL in config |
| UI shows 403 | Run IAM binding command above |

## 📚 Documentation

- [Publishing Guide](docs/guides/publishing/publish-server.md)
- [API Reference](docs/reference/api/)
- [Server.json Schema](docs/reference/server-json/)
- [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md)

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Registry won't start | Check Docker, ports 8080/5432, logs |
| Can't publish | Verify auth, namespace, server.json |
| Database errors | Check connection string, postgres health |

## 💬 Support

- **This registry**: Open an issue
- **MCP general**: [Docs](https://modelcontextprotocol.io) • [Discord](https://modelcontextprotocol.io/community/communication)

## 📄 License

See [LICENSE](LICENSE) file.

---

Built on [Model Context Protocol](https://modelcontextprotocol.io) by Anthropic
