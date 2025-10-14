import asyncio
import json
import os
from dotenv import load_dotenv
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent

load_dotenv()

def load_servers(config_file='mcp_servers.json'):
    """Load server configurations from JSON"""
    try:
        with open(config_file) as f:
            servers = json.load(f)['servers']
        
        # Convert to MultiServerMCPClient format
        return {
            s['name'].lower().replace(' ', '_'): {
                k: v for k, v in s.items() 
                if k not in ['name', 'enabled']
            }
            for s in servers if s.get('enabled', True)
        }
    except FileNotFoundError:
        print(f"{config_file} not found")
        return {}

async def run():
    # Load server configurations
    server_config = load_servers()
    if not server_config:
        return
    
    print(f"🔌 Connecting to {len(server_config)} server(s)...\n")
    
    # Initialize MCP client
    client = MultiServerMCPClient(server_config)
    
    try:
        # Get all tools from MCP servers
        tools = await client.get_tools()
        print(f"Connected! {len(tools)} tools available\n")
        
        # Create Gemini LLM
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=os.getenv('GEMINI_API_KEY'),
            temperature=0.7
        )
        
        # Create agent with Gemini + MCP tools
        agent = create_react_agent(llm, tools)
        
        print(f"{'='*50}")
        print(f"💬 Chat ready!")
        print(f"{'='*50}\n")
        
        # Chat loop
        while True:
            user_input = input("You: ").strip()
            
            if user_input.lower() in ['exit', 'quit']:
                break
            
            if user_input.lower() == 'tools':
                for tool in tools:
                    print(f"  • {tool.name}: {tool.description}")
                continue
            
            if not user_input:
                continue
            
            try:
                # Invoke agent
                response = await agent.ainvoke(
                    {"messages": [{"role": "user", "content": user_input}]}
                )
                
                # Get the last message from agent
                agent_message = response["messages"][-1].content
                print(f"\nAgent: {agent_message}\n")
                
            except Exception as e:
                print(f"\nError: {e}\n")
    
    finally:
        print("\n🔌 Closing connections...")
        await client.cleanup()


if __name__ == "__main__":
    asyncio.run(run())