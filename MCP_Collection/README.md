# MCP Collection UI

A beautiful web interface to view MCP servers from your private registry.

## Features

- 🎨 Modern, responsive design
- 🔍 Search functionality
- 🔄 Live refresh
- 📊 Server statistics
- 🎯 Clean server cards with all metadata

## Quick Start

### Step 1: Start the UI Server

Navigate to the MCP_Collection directory and run:

```bash
cd MCP_Collection
python server.py
```

The server will start at **http://localhost:5000**

### Step 2: Open in Browser

Visit: **http://localhost:5000**

### Step 3: View Your Servers

The UI will automatically:
- Fetch servers from your registry at `http://localhost:8080`
- Display them in beautiful cards
- Show statistics and metadata

## How It Works

1. **server.py** - Python HTTP server that:
   - Serves the UI files (HTML, CSS, JS)
   - Proxies API requests to avoid CORS issues
   - Runs on port 5000

2. **index.html** - Main UI structure

3. **styles.css** - Beautiful styling with gradient background

4. **app.js** - JavaScript that:
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
- Make sure your registry is running at `http://localhost:8080`
- Check with: `curl http://localhost:8080/v0/servers`

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

### Change API Endpoint:
Edit `server.py`, line with `urllib.request.urlopen(...)`

### Styling:
Modify `styles.css` to change colors, layout, etc.

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running.
