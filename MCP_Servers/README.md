# MCP Servers

Example MCP servers and templates for your private registry.

## 📦 Available Servers

### Simple Calculator
**Path:** `simple-calculator/`  
**Description:** Minimal calculator with add, subtract, multiply, divide  
**Tech:** Python + FastMCP (~40 lines)  
**Transport:** SSE (HTTP)  
**Docs:** [simple-calculator/DEPLOYMENT.md](simple-calculator/DEPLOYMENT.md)

## 🚀 Quick Start

### 1. Create Server

```python
# server.py
from fastmcp import FastMCP

mcp = FastMCP("Your Server")

@mcp.tool()
def your_tool(param: str) -> str:
    """What your tool does"""
    return f"Result: {param}"

if __name__ == "__main__":
    import os
    mcp.run(
        transport="sse",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 3000))
    )
```

### 2. Test Locally

```bash
pip install fastmcp uvicorn
python server.py
```

### 3. Publish

```bash
# Generate metadata
../../bin/mcp-publisher init

# Edit server.json with your details

# Authenticate & publish
../../bin/mcp-publisher login github --registry http://localhost:8080
../../bin/mcp-publisher publish --registry http://localhost:8080
```

## 📁 Server Structure

```
your-server/
├── server.py          # Server code
├── server.json        # Metadata
├── Dockerfile         # Container (for cloud)
├── cloudbuild.yaml    # GCP deployment
└── requirements.txt   # Dependencies
```

## 🔧 MCP Components

| Component | Purpose | Example |
|-----------|---------|---------|
| **Tools** | Functions AI can call | `@mcp.tool()` |
| **Resources** | Data AI can read | `@mcp.resource()` |
| **Prompts** | Template prompts | `@mcp.prompt()` |

## 🌐 Transport Types

| Type | Use Case | Connection |
|------|----------|------------|
| **SSE** | Remote servers | HTTP/HTTPS |
| **STDIO** | Local tools | Subprocess |

## ☁️ Deploy to Cloud

See [simple-calculator/DEPLOYMENT.md](simple-calculator/DEPLOYMENT.md) for deploying to Google Cloud Run.

## 📚 Resources

- [FastMCP Docs](https://github.com/jlowin/fastmcp)
- [MCP Protocol](https://modelcontextprotocol.io)
- [Main README](../README.md)

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Check port availability, dependencies |
| Can't publish | Verify authentication, namespace |
| Not in UI | Refresh UI, check API response |

## 💡 Tips

- Start simple, add features incrementally
- Test locally before publishing
- Use type hints for better AI integration
- Document your tools clearly
- Follow semantic versioning
