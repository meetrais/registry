# MCP Client with Google Gemini

A simple MCP client that uses Google Gemini as an LLM agent to interact with the Simple Calculator MCP Server.

## Setup

### 1. Install Dependencies

```bash
cd MCP_Client
pip install -r requirements.txt
```

### 2. Set Up Gemini API Key

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

Create a `.env` file in the `MCP_Client` directory:

```bash
GEMINI_API_KEY=your-api-key-here
```

## Usage

Make sure the calculator server is available, then run:

```bash
python client.py
```

## How It Works

1. Connects to the Simple Calculator MCP Server
2. Gets available tools (add, subtract, multiply, divide)
3. Takes user input
4. Asks Gemini if calculation is needed
5. If yes, calls the appropriate MCP tool
6. Returns result in natural language

## Example

```
Available tools: ['add', 'subtract', 'multiply', 'divide']

Chat (type 'exit' to quit)
----------------------------------------

You: What is 25 + 17?

Agent: The sum of 25 and 17 is 42.

You: exit
```

## Architecture

```
User Input
    ↓
Google Gemini (LLM Agent)
    ↓
MCP Client (client.py)
    ↓
MCP Server (simple-calculator)
    ↓
Calculation Result
    ↓
Gemini formats response
    ↓
User sees natural language answer
```

## Requirements

- Python 3.8+
- Google Gemini API key
- MCP Python SDK
- Simple Calculator MCP Server running
