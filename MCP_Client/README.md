# MCP Client

Test MCP servers using Google Gemini as the AI agent.

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Get API key from https://makersuite.google.com/app/apikey

# 3. Create .env file
echo "GEMINI_API_KEY=your-key-here" > .env

# 4. Run client
python client.py
```

## 💬 Example

```
You: What is 25 + 17?
Agent: The sum of 25 and 17 is 42.
```

## 🏗️ How It Works

```
User → Gemini → MCP Client → MCP Server → Result → Gemini → User
```

1. User asks question
2. Gemini decides if tool needed
3. Client calls MCP server tool
4. Server returns result
5. Gemini formats natural language response

## 📋 Requirements

- Python 3.8+
- Google Gemini API key
- MCP Python SDK
- MCP server running (local or cloud)
