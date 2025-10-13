import asyncio
import os
import json
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.sse import sse_client
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.5-flash')


def load_servers(config_file='mcp_servers.json'):
    """Load server configurations from JSON"""
    try:
        with open(config_file) as f:
            return [s for s in json.load(f)['servers'] if s.get('enabled', True)]
    except FileNotFoundError:
        print(f"❌ {config_file} not found")
        return []


async def connect_server(config):
    """Connect to MCP server (stdio or SSE)"""
    if config['transport'] == 'stdio':
        params = StdioServerParameters(
            command=config['command'],
            args=config['args']
        )
        return stdio_client(params)
    else:  # sse
        return sse_client(config['url'])


async def run():
    configs = load_servers()
    if not configs:
        return
    
    print(f"🔌 Connecting to {len(configs)} server(s)...\n")
    
    sessions = []
    all_tools = []
    tool_to_session = {}
    
    # Connect to all servers
    for config in configs:
        try:
            client_context = await connect_server(config)
            client = await client_context.__aenter__()
            read, write = client
            
            session = ClientSession(read, write)
            await session.__aenter__()
            await session.initialize()
            
            tools = (await session.list_tools()).tools
            print(f"✓ {config['name']}: {[t.name for t in tools]}")
            
            sessions.append((config, session, client_context))
            all_tools.extend(tools)
            
            for tool in tools:
                tool_to_session[tool.name] = session
                
        except Exception as e:
            print(f"✗ {config['name']}: {e}")
    
    if not sessions:
        print("\n❌ No servers connected")
        return
    
    print(f"\n{'='*50}")
    print(f"💬 Chat ready! ({len(all_tools)} tools available)")
    print(f"{'='*50}\n")
    
    try:
        while True:
            user_input = input("You: ").strip()
            
            if user_input.lower() in ['exit', 'quit']:
                break
            
            if user_input.lower() == 'tools':
                for tool in all_tools:
                    print(f"  • {tool.name}: {tool.description}")
                continue
            
            if not user_input:
                continue
            
            # Prepare tools info for Gemini
            tools_info = "\n".join([f"- {t.name}: {t.description}" for t in all_tools])
            
            prompt = f"""Available tools:
{tools_info}

User: {user_input}

If a tool is needed, respond ONLY with JSON: {{"tool": "tool_name", "args": {{}}}}
Otherwise, respond naturally."""
            
            try:
                response = model.generate_content(prompt)
                output = response.text.strip()
                
                # Check for tool call
                if output.startswith('{') and '"tool"' in output:
                    tool_call = json.loads(output)
                    tool_name = tool_call['tool']
                    tool_args = tool_call['args']
                    
                    if tool_name in tool_to_session:
                        result = await tool_to_session[tool_name].call_tool(tool_name, tool_args)
                        
                        if result.content:
                            tool_result = result.content[0].text
                            
                            # Get friendly response
                            final_prompt = f"Tool result: {tool_result}\nUser question: {user_input}\nRespond naturally:"
                            final = model.generate_content(final_prompt)
                            print(f"\nAgent: {final.text}\n")
                    else:
                        print(f"\nAgent: Tool '{tool_name}' not found.\n")
                else:
                    print(f"\nAgent: {output}\n")
                    
            except Exception as e:
                print(f"\nAgent: Error - {e}\n")
    
    finally:
        # Cleanup
        print("\n🔌 Closing connections...")
        for config, session, client_context in sessions:
            try:
                await session.__aexit__(None, None, None)
                await client_context.__aexit__(None, None, None)
            except:
                pass


if __name__ == "__main__":
    asyncio.run(run())
