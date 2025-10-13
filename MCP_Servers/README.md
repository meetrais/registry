# MCP Servers

This directory contains MCP (Model Context Protocol) servers for your private registry.

## Overview

MCP servers provide tools, resources, and prompts that AI assistants can use to interact with external systems and services. This folder contains example servers and serves as a template for creating new ones.

## Available Servers

### Simple Calculator (`simple-calculator/`)

A minimal example MCP server demonstrating basic arithmetic operations.

**Features:**
- Add, subtract, multiply, divide operations
- Built with FastMCP
- Runs as HTTP service (SSE transport)
- ~40 lines of Python code

**See:** `simple-calculator/README.md` for details

## Creating Your Own MCP Server

### Quick Start

1. **Create a new folder** in `MCP_Servers/`:
   ```bash
   mkdir MCP_Servers/your-server-name
   cd MCP_Servers/your-server-name
   ```

2. **Create your server** (example with FastMCP):
   ```python
   from fastmcp import FastMCP
   
   mcp = FastMCP("Your Server Name")
   
   @mcp.tool()
   def your_tool(param: str) -> str:
       """Description of what your tool does"""
       return f"Result: {param}"
   
   if __name__ == "__main__":
       mcp.run(transport="sse", host="localhost", port=3000)
   ```

3. **Generate server.json**:
   ```bash
   # From project root
   ./bin/mcp-publisher init
   ```

4. **Edit server.json** with your details:
   ```json
   {
     "name": "io.github.yourusername/your-server",
     "title": "Your Server Title",
     "description": "What your server does",
     "version": "1.0.0",
     "remotes": [{
       "type": "sse",
       "url": "http://localhost:3000/sse"
     }]
   }
   ```

5. **Publish to your private registry**:
   ```bash
   # Authenticate
   ../../bin/mcp-publisher login github --registry http://localhost:8080
   
   # Publish
   ../../bin/mcp-publisher publish --registry http://localhost:8080
   ```

## Server Structure

Typical MCP server folder structure:

```
your-server-name/
├── server.py          # Your MCP server code
├── server.json        # Server metadata for registry
├── README.md          # Documentation
└── requirements.txt   # Python dependencies
```

## Transport Types

### 1. STDIO Transport
- **Use case:** Local execution, command-line tools
- **Connection:** Client launches server as subprocess
- **Example:**
  ```json
  {
    "packages": [{
      "registryType": "pypi",
      "transport": {
        "type": "stdio",
        "command": "python",
        "args": ["server.py"]
      }
    }]
  }
  ```

### 2. SSE Transport (HTTP)
- **Use case:** Remote servers, web services
- **Connection:** Client connects via HTTP
- **Example:**
  ```json
  {
    "remotes": [{
      "type": "sse",
      "url": "http://localhost:3000/sse"
    }]
  }
  ```

## MCP Server Components

### Tools
Functions that AI assistants can call to perform actions:

```python
@mcp.tool()
def search(query: str) -> str:
    """Search for information"""
    return search_results(query)
```

### Resources
Data that AI assistants can read:

```python
@mcp.resource("file://path/to/file")
def get_file() -> str:
    """Read file contents"""
    return file_contents
```

### Prompts
Pre-defined prompt templates:

```python
@mcp.prompt()
def analyze_code(code: str) -> str:
    """Analyze code quality"""
    return f"Analyze this code: {code}"
```

## Best Practices

1. **Keep it simple** - Start with minimal functionality
2. **Document well** - Add clear descriptions to tools
3. **Use types** - Add type hints for parameters
4. **Test locally** - Run server before publishing
5. **Version properly** - Follow semantic versioning

## Development Workflow

```
1. Create server code → server.py
2. Test locally       → python server.py
3. Generate metadata  → mcp-publisher init
4. Edit server.json   → Add details
5. Publish            → mcp-publisher publish
6. View in UI         → http://localhost:5000
7. Use in client      → Copy integration code
```

## Example: Database Query Server

```python
from fastmcp import FastMCP
import sqlite3

mcp = FastMCP("Database Query")

@mcp.tool()
def query_db(sql: str) -> str:
    """Execute SQL query"""
    conn = sqlite3.connect("data.db")
    result = conn.execute(sql).fetchall()
    return str(result)

if __name__ == "__main__":
    mcp.run(transport="sse", host="localhost", port=3001)
```

## Resources

- **FastMCP Documentation:** https://github.com/jlowin/fastmcp
- **MCP Protocol:** https://modelcontextprotocol.io
- **Registry Guide:** `../README.md`

## Troubleshooting

**Server won't start:**
- Check port not in use
- Verify Python dependencies installed
- Check server.py for syntax errors

**Can't publish:**
- Ensure authenticated with registry
- Check namespace matches your auth
- Validate server.json format

**Not showing in UI:**
- Verify publish was successful
- Refresh UI (click refresh button)
- Check registry API: `curl http://localhost:8080/v0/servers`

## Contributing

Add your servers to this directory and share them with your team! Each server should have:
- Working code
- README with usage instructions
- Valid server.json
- requirements.txt for dependencies
