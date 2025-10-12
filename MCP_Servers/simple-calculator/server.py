#!/usr/bin/env python3
"""
Simple Calculator MCP Server using FastMCP
A minimal example showing how to create an MCP server with just a few lines of code.

Install: pip install fastmcp
Run: python server.py
"""

from fastmcp import FastMCP

# Create MCP server instance
mcp = FastMCP("Simple Calculator")

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
    mcp.run(transport="sse", host="192.168.1.68", port=3000)
