# Private MCP Registry

A self-hosted private registry for Model Context Protocol (MCP) servers. This fork is configured to run as a **private registry** without seeding from public MCP servers.

## What is This?

This is a complete MCP registry system that you can run locally or deploy privately. It allows you to:
- Host your own private catalog of MCP servers
- Control who can publish and access servers
- Keep your MCP infrastructure completely private
- Avoid dependencies on public registries

## Quick Start

### Prerequisites

- **Docker Desktop** - For running the registry and PostgreSQL
- **Go 1.24+** - For building the publisher CLI tool

### Step 1: Start the Private Registry

1. Clone this repository:
```bash
git clone https://github.com/meetrais/registry.git
cd registry
```

2. Start the registry with Docker Compose:
```bash
docker compose up -d
```

This starts:
- **Registry API** at `http://localhost:8080`
- **PostgreSQL database** for storing server metadata

3. Verify it's running:
```bash
curl http://localhost:8080/v0/servers
```

You should see an empty registry:
```json
{"servers":[],"metadata":{"count":0}}
```

### Step 2: Build the Publisher CLI

Build the MCP publisher tool:

**Windows:**
```powershell
go build -o bin/mcp-publisher.exe ./cmd/publisher
```

**macOS/Linux:**
```bash
go build -o bin/mcp-publisher ./cmd/publisher
```

Verify it works:
```bash
./bin/mcp-publisher --help
```

## Example: Sample MCP Server

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

## Publishing Your MCP Servers

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

## Configuration

### Environment Variables

Key configuration settings in `.env`:

```bash
# Server configuration
MCP_REGISTRY_SERVER_ADDRESS=:8080

# Database (for Docker Compose)
MCP_REGISTRY_DATABASE_URL=postgres://mcpregistry:mcpregistry@postgres:5432/mcp-registry

# Seed from public registry (DISABLED for private registry)
MCP_REGISTRY_SEED_FROM=

# GitHub OAuth for authentication
MCP_REGISTRY_GITHUB_CLIENT_ID=Iv23licy3GSiM9Km5jtd
MCP_REGISTRY_GITHUB_CLIENT_SECRET=0e8db54879b02c29adef51795586f3c510a9341d

# Anonymous auth (useful for testing)
MCP_REGISTRY_ENABLE_ANONYMOUS_AUTH=false
```

### Docker Compose Configuration

The `docker-compose.yml` is pre-configured for private registry use:
- No public server seeding (empty `MCP_REGISTRY_SEED_FROM`)
- PostgreSQL with ephemeral storage
- Registry API on port 8080

## API Endpoints

Once running, your registry provides:

- **List all servers:** `GET http://localhost:8080/v0/servers`
- **Search servers:** `GET http://localhost:8080/v0/servers?search=keyword`
- **Get specific server:** `GET http://localhost:8080/v0/servers/<namespace>/<identifier>`
- **API documentation:** `http://localhost:8080/docs`

## Architecture

```
┌─────────────────┐
│   MCP Client    │
│  (Claude, etc)  │
└────────┬────────┘
         │ HTTP API
         ▼
┌─────────────────┐
│  Registry API   │
│  (Port 8080)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   Database      │
└─────────────────┘
```

## Key Differences from Public Registry

This private registry is configured to:

✅ **Start empty** - No public servers are seeded  
✅ **Stay private** - Only accessible on localhost by default  
✅ **Full control** - You control all published servers  
✅ **Complete features** - All authentication and validation features work  

The key change is setting `MCP_REGISTRY_SEED_FROM` to empty in both `.env` and `docker-compose.yml`.

## Advanced Usage

### Production Deployment

For production deployment:

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

## Documentation

- **Publishing Guide:** `docs/guides/publishing/publish-server.md`
- **API Reference:** `docs/reference/api/`
- **Server.json Schema:** `docs/reference/server-json/`
- **Architecture:** `docs/explanations/tech-architecture.md`

## Troubleshooting

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

## Contributing

This is a fork of the official MCP registry configured for private use. For contributions to the upstream project, see [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry).

## License

See [LICENSE](LICENSE) file for details.

## Support

For issues specific to this private registry setup, please open an issue in this repository.

For general MCP questions, see:
- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Discord](https://modelcontextprotocol.io/community/communication)
