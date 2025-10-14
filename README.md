# Private MCP Registry

A complete, self-hosted registry system for [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers. Run your own private catalog of MCP servers with full control over publishing, authentication, and access.

## 🎯 Overview

This is a production-ready MCP registry that you can run locally or deploy to the cloud. It provides:

- **🏠 Private Hosting** - Keep your MCP infrastructure completely private
- **🔐 Secure Authentication** - GitHub OAuth, DNS, HTTP, or anonymous auth
- **🌐 Web Interface** - Beautiful UI for browsing and managing servers
- **📦 Multi-Package Support** - NPM, PyPI, NuGet, Docker, MCPB, and remote servers
- **☁️ Cloud Ready** - Deploy to Google Cloud Run with one command
- **🔧 Publisher CLI** - Easy-to-use tool for publishing servers
- **📊 Full API** - RESTful API for programmatic access

### What is MCP?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open standard that enables AI assistants to securely connect to external data sources and tools. This registry helps you catalog and distribute your MCP servers.

## 📖 Table of Contents

- [Architecture](#️-architecture)
- [Quick Start](#-quick-start)
- [Key Features](#-key-features)
- [Example: Sample Server](#-example-sample-mcp-server)
- [Publishing Servers](#-publishing-your-mcp-servers)
- [Authentication Methods](#authenticate)
- [Configuration](#️-configuration)
- [GCP Deployment](#-gcp-deployment)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Registry Ecosystem                        │
└─────────────────────────────────────────────────────────────────┘

    Developer Workflow                Registry System
    ─────────────────                ───────────────

┌─────────────────┐                 ┌──────────────────┐
│  Create Server  │                 │   Registry API   │
│  (MCP_Servers/) │                 │   (Go Backend)   │
└────────┬────────┘                 │   Port: 8080     │
         │                           └────────┬─────────┘
         │                                    │
         ▼                                    │
┌─────────────────┐                          │
│ Publisher CLI   │──────Publish────────────▶│
│ (Authenticate)  │                           │
└─────────────────┘                          │
                                              ▼
    User Interface                   ┌──────────────────┐
    ──────────────                   │   PostgreSQL     │
                                     │    Database      │
┌─────────────────┐                  └──────────────────┘
│ Collection UI   │◀────Browse────────────┘
│ (Web Browser)   │
│  Port: 5000     │
└─────────────────┘

┌─────────────────┐
│  MCP Client     │──────Use────────▶ Published Servers
│  (AI Assistant) │
└─────────────────┘
```

### Components

| Component | Description | Technology | Port |
|-----------|-------------|------------|------|
| **Registry API** | Core backend service | Go | 8080 |
| **PostgreSQL** | Server metadata storage | PostgreSQL 16 | 5432 |
| **Collection UI** | Web interface | Python + HTML/JS | 5000 |
| **Publisher CLI** | Publishing tool | Go | - |
| **MCP Servers** | Your MCP implementations | Any | Various |

### Project Structure

```
registry/
├── cmd/
│   ├── publisher/          # Publisher CLI tool
│   └── registry/           # Registry API server
├── internal/               # Go backend code
│   ├── api/               # REST API handlers
│   ├── auth/              # Authentication logic
│   ├── database/          # Database layer
│   └── validators/        # Server validation
├── MCP_Collection/        # Web UI for browsing
│   ├── server.py          # Python HTTP server
│   ├── index.html         # UI interface
│   ├── app.js             # Frontend logic
│   └── styles.css         # Styling
├── MCP_Servers/           # Example MCP servers
│   └── simple-calculator/ # Sample server
├── MCP_Client/            # AI test client
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
```

Visit **http://localhost:5000** to browse your registry with a visual interface.

### What's Running?

After setup, you have:

| Service | URL | Description |
|---------|-----|-------------|
| Registry API | http://localhost:8080 | REST API for server management |
| Web UI | http://localhost:5000 | Browse and register servers |
| PostgreSQL | localhost:5432 | Database (internal) |
| API Docs | http://localhost:8080/docs | Interactive API documentation |

## 💡 Example: Sample MCP Server

This repository includes a sample MCP server at `MCP_Servers/simple-calculator/` to help you get started.

### Sample Server Overview

The sample calculator server (`server.py`) is built with FastMCP and demonstrates:
- Basic MCP server structure with minimal code
- Tool implementation (add, subtract, multiply, divide)
- Resource implementation (server info)

**View the code:** `MCP_Servers/simple-calculator/server.py`

### Try the Sample Server

**1. Install FastMCP and dependencies:**
```bash
pip install fastmcp uvicorn
```

**2. Run the sample server as HTTP service:**
```bash
python MCP_Servers/simple-calculator/server.py
```

This starts the MCP server at `http://localhost:3000/mcp` using Server-Sent Events (SSE) transport.

**3. Generate server.json:**
```bash
cd MCP_Servers/simple-calculator

# Windows
..\..\bin\mcp-publisher.exe init

# macOS/Linux
../../bin/mcp-publisher init
```

**4. Edit the generated `server.json`:**

**Important:** Make sure the server is running at `http://localhost:3000` before publishing. Update `yourusername` to match your GitHub username.

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
      "url": "http://localhost:3000/sse"
    }
  ]
}
```

**Note:** The sample server runs as an HTTP service using Server-Sent Events (SSE) transport on `http://localhost:3000`.

**5. Authenticate and publish:**
```bash
# Windows (using GitHub authentication)
..\\..\\bin\\mcp-publisher.exe login github --registry http://localhost:8080
..\\..\\bin\\mcp-publisher.exe publish --registry http://localhost:8080

# macOS/Linux (using GitHub authentication)
../../bin/mcp-publisher login github --registry http://localhost:8080
../../bin/mcp-publisher publish --registry http://localhost:8080
```

**Note:** This will open your browser for GitHub OAuth authentication. Make sure your `server.json` uses a namespace like `io.github.yourusername/*` that matches your GitHub account.

**6. Verify it's published:**
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

## 📤 Publishing Your MCP Servers

### Create a server.json File

Navigate to your MCP server's directory and create a template:

```bash
cd path/to/your/mcp-server
/path/to/registry/bin/mcp-publisher init
```

This generates a `server.json` file. Edit it with your server's details:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
  "name": "io.github.yourname/my-mcp-server",
  "title": "My MCP Server",
  "description": "Description of what your server does",
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@yourname/my-mcp-server",
      "version": "1.0.0",
      "transport": {
        "type": "stdio"
      }
    }
  ]
}
```

### Authenticate

The registry uses **namespace-based authorization** to ensure only authorized users can publish servers. Choose the authentication method that matches your namespace:

#### 1. GitHub OAuth Authentication (Recommended)

**For namespaces:** `io.github.username/*`

**How it works:**
- Opens your browser for GitHub OAuth authentication
- Proves you own the GitHub account
- Allows publishing to `io.github.yourusername/*` namespace only

**Command:**

**Windows:**
```powershell
# If you're in the registry project root directory
.\bin\mcp-publisher.exe login github --registry http://localhost:8080

# If you're in a subdirectory (e.g., MCP_Servers/simple-calculator)
# Use .. to go up directories until you reach the project root, then access bin/
..\..\\bin\mcp-publisher.exe login github --registry http://localhost:8080
```

**macOS/Linux:**
```bash
# If you're in the registry project root directory
./bin/mcp-publisher login github --registry http://localhost:8080

# If you're in a subdirectory (e.g., MCP_Servers/simple-calculator)
# Use .. to go up directories until you reach the project root, then access bin/
../../bin/mcp-publisher login github --registry http://localhost:8080
```

**💡 Tip:** The path `..` means "go up one directory". From `MCP_Servers/simple-calculator`, you need `..\..\` (Windows) or `../../` (Unix) to go up two levels to reach the project root where the `bin` folder is located.

**Example server.json:**
```json
{
  "name": "io.github.johndoe/my-server",
  ...
}
```

**Requirements:**
- GitHub account
- Namespace must match: `io.github.yourusername/*`

---

#### 2. DNS Authentication

**For namespaces:** `com.yourcompany/*`, `io.yourdomain/*`, etc.

**How it works:**
- Generates a public key from your private key
- You add a TXT record to your domain's DNS
- Registry verifies you control the domain by checking the DNS record

**Step 1 - Generate key pair:**
```bash
# Generate Ed25519 private key
openssl genpkey -algorithm Ed25519 -out key.pem

# Get public key for DNS record
echo "yourcompany.com. IN TXT \"v=MCPv1; k=ed25519; p=$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)\""

# Get private key seed for login
openssl pkey -in key.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n'
```

**Step 2 - Add DNS TXT record:**
```
yourcompany.com. IN TXT "v=MCPv1; k=ed25519; p=<YOUR_PUBLIC_KEY>"
```

**Step 3 - Login:**

**Windows:**
```powershell
.\bin\mcp-publisher.exe login dns --domain yourcompany.com --private-key <YOUR_PRIVATE_KEY_SEED> --registry http://localhost:8080
```

**macOS/Linux:**
```bash
./bin/mcp-publisher login dns \
  --domain yourcompany.com \
  --private-key <YOUR_PRIVATE_KEY_SEED> \
  --registry http://localhost:8080
```

**Example server.json:**
```json
{
  "name": "com.yourcompany/api-server",
  ...
}
```

**Requirements:**
- Own a domain
- Access to DNS management
- Ed25519 key pair

---

#### 3. HTTP Authentication

**For namespaces:** `com.yourcompany/*`, `io.yourdomain/*`, etc.

**How it works:**
- Similar to DNS, but uses HTTP verification instead
- You place a verification file at `https://yourdomain.com/.well-known/mcp-registry.txt`
- Registry fetches and verifies the file

**Step 1 - Generate key pair:**
```bash
# Generate Ed25519 private key
openssl genpkey -algorithm Ed25519 -out key.pem

# Get public key
PUBLIC_KEY=$(openssl pkey -in key.pem -pubout -outform DER | tail -c 32 | base64)

# Get private key seed
PRIVATE_KEY=$(openssl pkey -in key.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n')

echo "Public Key: $PUBLIC_KEY"
echo "Private Key Seed: $PRIVATE_KEY"
```

**Step 2 - Create verification file:**

Host this at `https://yourcompany.com/.well-known/mcp-registry.txt`:
```
v=MCPv1; k=ed25519; p=<YOUR_PUBLIC_KEY>
```

**Step 3 - Login:**

**Windows:**
```powershell
.\bin\mcp-publisher.exe login http --domain yourcompany.com --private-key <YOUR_PRIVATE_KEY_SEED> --registry http://localhost:8080
```

**macOS/Linux:**
```bash
./bin/mcp-publisher login http \
  --domain yourcompany.com \
  --private-key <YOUR_PRIVATE_KEY_SEED> \
  --registry http://localhost:8080
```

**Example server.json:**
```json
{
  "name": "com.yourcompany/analytics-server",
  ...
}
```

**Requirements:**
- Own a domain with web hosting
- Can place files at `/.well-known/` path
- Ed25519 key pair

---

#### 4. Anonymous Authentication

**For namespaces:** `io.modelcontextprotocol.anonymous/*`

**How it works:**
- No verification required
- Only for testing purposes
- Must be enabled in registry configuration

**Enable anonymous auth:**

Update `.env`:
```bash
MCP_REGISTRY_ENABLE_ANONYMOUS_AUTH=true
```

Restart registry:
```bash
docker compose restart registry
```

**Login:**

**Windows:**
```powershell
.\bin\mcp-publisher.exe login none --registry http://localhost:8080
```

**macOS/Linux:**
```bash
./bin/mcp-publisher login none --registry http://localhost:8080
```

**Example server.json:**
```json
{
  "name": "io.modelcontextprotocol.anonymous/test-server",
  ...
}
```

**⚠️ Warning:** Only use for testing. Disable in production.

---

### Authentication Comparison

| Method | Namespaces | Verification | Use Case |
|--------|-----------|--------------|----------|
| **GitHub** | `io.github.username/*` | OAuth browser flow | Personal projects, open source |
| **DNS** | `com.yourcompany/*` | DNS TXT record | Corporate, custom domains |
| **HTTP** | `com.yourcompany/*` | Web file verification | Corporate, custom domains |
| **Anonymous** | `io.modelcontextprotocol.anonymous/*` | None | Testing only |

**Which should I use?**
- 👤 Individual developer → **GitHub OAuth**
- 🏢 Company domain → **DNS or HTTP**
- 🧪 Testing → **Anonymous** (temporarily enable)


### Publish Your Server

From the directory containing your `server.json`:

**Windows:**
```powershell
.\bin\mcp-publisher.exe publish --registry http://localhost:8080
```

**macOS/Linux:**
```bash
./bin/mcp-publisher publish --registry http://localhost:8080
```

### Verify Publication

Check that your server appears in the registry:

```bash
curl http://localhost:8080/v0/servers
```

## Supported Package Types

Your private registry supports:

- **📦 NPM packages** - Node.js packages
- **🐍 PyPI packages** - Python packages  
- **📋 NuGet packages** - .NET packages
- **🐳 OCI/Docker images** - Container images (Docker Hub, GitHub Container Registry)
- **📁 MCPB packages** - MCP binary packages
- **🌐 Remote servers** - Hosted web services

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

Deploy both the Registry API and Collection UI to Google Cloud Run with managed PostgreSQL and automatic scaling.

### Prerequisites

- Google Cloud Project created
- `gcloud` CLI installed and authenticated
- Cloud SQL, Secret Manager, and required APIs enabled

### Quick Setup

1. **Enable required APIs:**
```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com
```

2. **Create Cloud SQL database:**
```bash
gcloud sql instances create mcp-registry-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

gcloud sql databases create mcp-registry --instance=mcp-registry-db
gcloud sql users create mcpregistry --instance=mcp-registry-db --password=YOUR_PASSWORD
```

3. **Create secrets:**
```bash
# Database URL
DB_URL="postgres://mcpregistry:YOUR_PASSWORD@/mcp-registry?host=/cloudsql/PROJECT_ID:us-central1:mcp-registry-db"
echo -n "$DB_URL" | gcloud secrets create database-url --data-file=-

# JWT key
JWT_KEY=$(openssl rand -hex 32)
echo -n "$JWT_KEY" | gcloud secrets create jwt-private-key --data-file=-

# GitHub OAuth (optional)
echo -n "YOUR_GITHUB_CLIENT_ID" | gcloud secrets create github-client-id --data-file=-
echo -n "YOUR_GITHUB_CLIENT_SECRET" | gcloud secrets create github-client-secret --data-file=-
```

4. **Grant IAM permissions:**
```bash
PROJECT_NUMBER=$(gcloud projects describe PROJECT_ID --format="value(projectNumber)")

for SECRET in database-url jwt-private-key github-client-id github-client-secret; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### Deploy Registry

From the project root:

```bash
gcloud builds submit --config cloudbuild.yaml
```

Get the registry URL:
```bash
REGISTRY_URL=$(gcloud run services describe mcp-registry --region=us-central1 --format="value(status.url)")
echo "Registry URL: $REGISTRY_URL"
```

### Deploy Collection UI

1. **Update UI configuration:**

Edit `MCP_Collection/cloudbuild.yaml` and set `_REGISTRY_URL` to your registry URL.

2. **Deploy from MCP_Collection directory:**

```bash
cd MCP_Collection
gcloud builds submit --config cloudbuild.yaml
```

**Important:** You must run this from the `MCP_Collection` directory because the root `.gcloudignore` excludes it.

3. **Enable public access:**

```bash
gcloud run services add-iam-policy-binding mcp-collection-ui \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

4. **Get UI URL:**

```bash
UI_URL=$(gcloud run services describe mcp-collection-ui --region=us-central1 --format="value(status.url)")
echo "UI URL: $UI_URL"
```

### Deployed Services

After deployment, you'll have:

- **Registry API**: `https://mcp-registry-xxxxx-uc.a.run.app`
  - REST API for server management
  - Connected to Cloud SQL PostgreSQL
  - Auto-scales 1-10 instances

- **Collection UI**: `https://mcp-collection-ui-xxxxx-uc.a.run.app`
  - Web interface for browsing servers
  - GitHub OAuth login
  - Server registration form
  - Auto-scales 0-5 instances (scales to zero)

### Update GitHub OAuth

After deployment, update your GitHub OAuth app:

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Update callback URL to: `https://YOUR_UI_URL/`
3. Save changes

### Updating Deployments

**Update Registry:**
```bash
cd /path/to/registry
gcloud builds submit --config cloudbuild.yaml
```

**Update UI:**
```bash
cd /path/to/registry/MCP_Collection
gcloud builds submit --config cloudbuild.yaml
```

### Monitoring

```bash
# View registry logs
gcloud run services logs read mcp-registry --region=us-central1 --limit=50 --follow

# View UI logs
gcloud run services logs read mcp-collection-ui --region=us-central1 --limit=50 --follow

# List all services
gcloud run services list --region=us-central1
```

### Cost Estimate

- **Registry**: ~$5-20/month (includes Cloud SQL db-f1-micro)
- **UI**: ~$0-5/month (scales to zero when idle)
- **Total**: ~$5-25/month for low-medium usage

### Troubleshooting

**Registry won't start:**
- Check Cloud SQL is running: `gcloud sql instances describe mcp-registry-db`
- Verify secrets exist: `gcloud secrets list`
- Check logs: `gcloud run services logs read mcp-registry --region=us-central1 --limit=50`

**UI deployment fails:**
- Ensure you're running from `MCP_Collection` directory
- Verify registry URL is set in `cloudbuild.yaml`
- Check build logs: `gcloud builds list --limit=5`

**UI shows 403 errors:**
- Run: `gcloud run services add-iam-policy-binding mcp-collection-ui --region=us-central1 --member="allUsers" --role="roles/run.invoker"`

For detailed setup instructions, see [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md).

### Other Production Deployments

For other production deployment options:

1. Update database credentials in `.env`
2. Configure proper domain and SSL/TLS
3. Set up proper GitHub OAuth app (or disable)
4. Enable OIDC for admin access if needed
5. Deploy using the `deploy/` directory configurations

### Package Validation

The registry validates package ownership:

- **NPM**: Requires `mcpName` field in `package.json`
- **PyPI**: Requires `mcp-name:` in README
- **NuGet**: Requires `mcp-name:` in package README
- **OCI**: Requires `io.modelcontextprotocol.server.name` label
- **MCPB**: Requires SHA-256 hash for integrity

See `docs/guides/publishing/publish-server.md` for detailed requirements.

### Namespace Authorization

- `io.github.username/*` - Requires GitHub authentication as that user
- `com.yourcompany/*` - Requires DNS/HTTP verification of domain ownership
- `io.modelcontextprotocol.anonymous/*` - Available when anonymous auth is enabled

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Publishing Guide](docs/guides/publishing/publish-server.md) | How to publish servers |
| [API Reference](docs/reference/api/) | Complete API documentation |
| [Server.json Schema](docs/reference/server-json/) | Server configuration format |
| [Architecture](docs/explanations/tech-architecture.md) | Technical architecture details |
| [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) | Detailed GCP deployment guide |

## 🔧 Troubleshooting

### Registry won't start
- Ensure Docker Desktop is running
- Check ports 8080 and 5432 are available
- Review logs: `docker compose logs registry`

### Can't publish servers
- Verify authentication: Check you're logged in with correct credentials
- Check namespace: Ensure your namespace matches your auth method
- Validate server.json: Use the JSON schema to validate your file

### Database connection errors
- If running outside Docker, update `MCP_REGISTRY_DATABASE_URL` in `.env`
- For Docker Compose, ensure the postgres service is healthy

## 🤝 Contributing

This is a fork of the official MCP registry configured for private use. For contributions to the upstream project, see [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry).

## 📄 License

See [LICENSE](LICENSE) file for details.

## 💬 Support

**For this private registry:**
- Open an issue in this repository
- Check the [Troubleshooting](#-troubleshooting) section

**For general MCP questions:**
- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Discord](https://modelcontextprotocol.io/community/communication)
- [MCP GitHub](https://github.com/modelcontextprotocol)

## ⭐ Acknowledgments

Built on the [Model Context Protocol](https://modelcontextprotocol.io) standard by Anthropic.

---

**Made with ❤️ for the MCP community**
