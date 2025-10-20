#!/usr/bin/env python3
"""
Simple Calculator MCP Server using FastMCP with Bearer Token Authentication
A minimal example showing how to create an MCP server with simple auth.

Install: pip install fastmcp
Run: python server.py

Set AUTH_TOKEN environment variable or use default: "your-secret-token-here"
"""

from fastmcp import FastMCP
from fastapi import Request, HTTPException, status
import os

# Create MCP server instance
mcp = FastMCP("Simple Calculator")

# Simple Bearer token authentication
AUTH_TOKEN = os.environ.get("AUTH_TOKEN", "your-secret-token-here")

async def verify_auth(request: Request):
    """Verify Bearer token in Authorization header"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Use: Bearer <token>"
        )
    
    token = auth_header[7:]  # Remove "Bearer " prefix
    
    if token != AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    return True

# Add authentication middleware to all MCP endpoints
@mcp.custom_route("/sse", methods=["GET"])
async def protected_sse(request: Request):
    """Protected SSE endpoint"""
    await verify_auth(request)
    # Continue with normal SSE handling
    return await mcp.sse_handler(request)

@mcp.tool()
def add(a: float, b: float) -> float:
    """Add two numbers together"""
    return a + b

@mcp.tool()
def subtract(a: float, b: float) -> float:
    """Subtract b from a"""
    return a - b

@mcp.tool()
def multiply(a: float, b: float) -> float:
    """Multiply two numbers"""
    return a * b

@mcp.tool()
def divide(a: float, b: float) -> float:
    """Divide a by b"""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

@mcp.resource("calc://info")
def get_info() -> str:
    """Get information about the calculator"""
    return "Simple Calculator MCP Server v1.0.0\nSupports: add, subtract, multiply, divide"

if __name__ == "__main__":
    # Run the server as HTTP service
    import uvicorn
    
    # Cloud Run sets PORT environment variable
    port = int(os.environ.get("PORT", 3000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"🔐 Starting MCP Server with Bearer Token Authentication")
    print(f"📍 Server: http://{host}:{port}")
    print(f"🔑 Auth Token: {AUTH_TOKEN}")
    print(f"\nTo connect, use Authorization header:")
    print(f"   Authorization: Bearer {AUTH_TOKEN}")
    
    mcp.run(transport="sse", host=host, port=port)
