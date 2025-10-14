# MCP Collection UI

A beautiful web interface to view MCP servers from your private registry.

## Features

- 🎨 Modern, responsive design
- 🔍 Search functionality
- 🔄 Live refresh
- 📊 Server statistics
- 🎯 Clean server cards with all metadata

## Quick Start

### Step 1: Install Dependencies

The server requires `python-dotenv` to load configuration from the `.env` file:

```bash
pip install python-dotenv
```

### Step 2: Configure Registry URL

Edit the `.env` file in the `MCP_Collection` directory to point to your registry:

```bash
# For local development
MCP_REGISTRY_URL=http://localhost:8080

# For Cloud Run deployment
MCP_REGISTRY_URL=https://your-registry-url.run.app
```

### Step 3: Start the UI Server

Navigate to the MCP_Collection directory and run:

```bash
cd MCP_Collection
python server.py
```

The server will start at **http://localhost:5000**

### Step 4: Open in Browser

Visit: **http://localhost:5000**

### Step 5: View Your Servers

The UI will automatically:
- Fetch servers from your configured registry (check `.env` file)
- Display them in beautiful cards
- Show statistics and metadata

## How It Works

1. **.env** - Configuration file that:
   - Stores the registry URL
   - Can be customized for local or cloud deployment

2. **server.py** - Python HTTP server that:
   - Loads configuration from `.env` file
   - Serves the UI files (HTML, CSS, JS)
   - Proxies API requests to avoid CORS issues
   - Runs on port 5000

3. **index.html** - Main UI structure

4. **styles.css** - Beautiful styling with gradient background

5. **app.js** - JavaScript that:
   - Fetches servers from `/api/servers`
   - Displays them in cards
   - Handles search and refresh

## Architecture

```
Browser (localhost:5000)
    ↓
Python Server (server.py)
    ↓ (proxies to)
Registry API (localhost:8080/v0/servers)
```

## Features in Detail

### Server Cards Show:
- Server icon (dynamic based on type)
- Title and full name
- Description
- Version badge
- Status badge (active/inactive)
- Transport type
- Published/Updated dates
- Endpoint URL (clickable)

### Search:
- Filter by server name, title, or description
- Real-time filtering

### Statistics:
- Total servers count
- Active servers count

## Troubleshooting

**"Failed to load servers" error:**
- Check the `MCP_REGISTRY_URL` in your `.env` file
- Make sure your registry is running at the configured URL
- For local: `curl http://localhost:8080/v0/servers`
- For Cloud Run: `curl https://your-registry-url.run.app/v0/health`

**Port 5000 already in use:**
- Edit `server.py` and change `PORT = 5000` to another port
- Update the URL you visit in your browser

**CORS errors:**
- Make sure you're accessing via `http://localhost:5000`
- Don't open `index.html` directly (file://)
- The Python server handles CORS automatically

## Customization

### Change Port:
Edit `server.py`, line: `PORT = 5000`

### Change Registry URL:
Edit `.env` file and update `MCP_REGISTRY_URL`

### Styling:
Modify `styles.css` to change colors, layout, etc.

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running.
