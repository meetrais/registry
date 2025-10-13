// Configuration
// Use proxied API endpoint to avoid CORS issues
const REGISTRY_API = '/api/servers';

// State
let allServers = [];
let filteredServers = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadServers();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const submitBtn = document.getElementById('submitBtn');
    const serverForm = document.getElementById('serverForm');
    const serverTypeSelect = document.getElementById('serverType');

    searchInput.addEventListener('input', (e) => {
        filterServers(e.target.value);
    });

    refreshBtn.addEventListener('click', () => {
        loadServers();
    });

    submitBtn.addEventListener('click', () => {
        openSubmitModal();
    });

    serverForm.addEventListener('submit', (e) => {
        e.preventDefault();
        generateServerJson();
    });

    serverTypeSelect.addEventListener('change', (e) => {
        toggleServerTypeFields(e.target.value);
    });
}

// Load servers from registry API
async function loadServers() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const serverGrid = document.getElementById('serverGrid');

    loading.style.display = 'block';
    error.style.display = 'none';
    serverGrid.innerHTML = '';

    try {
        const response = await fetch(REGISTRY_API);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allServers = data.servers || [];
        filteredServers = [...allServers];

        updateStats();
        renderServers();
        
    } catch (err) {
        console.error('Error loading servers:', err);
        error.textContent = `Failed to load servers: ${err.message}`;
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Filter servers based on search query
function filterServers(query) {
    const lowerQuery = query.toLowerCase();
    
    if (!query.trim()) {
        filteredServers = [...allServers];
    } else {
        filteredServers = allServers.filter(item => {
            const server = item.server;
            return (
                server.name?.toLowerCase().includes(lowerQuery) ||
                server.title?.toLowerCase().includes(lowerQuery) ||
                server.description?.toLowerCase().includes(lowerQuery)
            );
        });
    }
    
    renderServers();
}

// Update statistics
function updateStats() {
    const totalServers = document.getElementById('totalServers');
    const activeServers = document.getElementById('activeServers');

    totalServers.textContent = allServers.length;
    
    const active = allServers.filter(item => 
        item._meta?.['io.modelcontextprotocol.registry/official']?.status === 'active'
    ).length;
    
    activeServers.textContent = active;
}

// Render server cards
function renderServers() {
    const serverGrid = document.getElementById('serverGrid');
    serverGrid.innerHTML = '';

    if (filteredServers.length === 0) {
        serverGrid.innerHTML = `
            <div class="empty-state">
                <h2>📭 No Servers Found</h2>
                <p>Try publishing a server to your private registry</p>
            </div>
        `;
        return;
    }

    filteredServers.forEach(item => {
        const server = item.server;
        const meta = item._meta?.['io.modelcontextprotocol.registry/official'];
        
        const card = createServerCard(server, meta);
        serverGrid.appendChild(card);
    });
}

// Create a server card element
function createServerCard(server, meta) {
    const card = document.createElement('div');
    card.className = 'server-card';

    // Determine icon based on server type
    const icon = getServerIcon(server);

    // Get transport info
    const transportInfo = getTransportInfo(server);

    // Format dates
    const publishedDate = meta?.publishedAt ? new Date(meta.publishedAt).toLocaleDateString() : 'N/A';
    const updatedDate = meta?.updatedAt ? new Date(meta.updatedAt).toLocaleDateString() : 'N/A';

    card.innerHTML = `
        <div class="server-header">
            <div class="server-icon">${icon}</div>
            <div class="server-title">
                <h3>${escapeHtml(server.title || 'Untitled Server')}</h3>
                <div class="server-name">${escapeHtml(server.name || '')}</div>
            </div>
        </div>

        <div class="server-description">
            ${escapeHtml(server.description || 'No description available')}
        </div>

        <div class="server-meta">
            <span class="badge badge-version">v${escapeHtml(server.version || '1.0.0')}</span>
            <span class="badge badge-status">${escapeHtml(meta?.status || 'unknown')}</span>
            ${transportInfo ? `<span class="badge badge-transport">${transportInfo}</span>` : ''}
        </div>

        <div class="server-details">
            <div class="detail-row">
                <span class="detail-label">Published:</span>
                <span>${publishedDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Updated:</span>
                <span>${updatedDate}</span>
            </div>
            ${getEndpointDetails(server)}
        </div>

        <button class="integration-btn">
            Get Integration JSON
        </button>
    `;
    
    // Add event listener to button after DOM creation
    const button = card.querySelector('.integration-btn');
    button.addEventListener('click', () => showIntegration(server));

    return card;
}

// Get server icon based on type/name
function getServerIcon(server) {
    const name = server.name?.toLowerCase() || '';
    
    if (name.includes('calculator')) return '🔢';
    if (name.includes('weather')) return '🌤️';
    if (name.includes('file')) return '📁';
    if (name.includes('database') || name.includes('sql')) return '🗄️';
    if (name.includes('api')) return '🔌';
    if (name.includes('git')) return '🔧';
    if (name.includes('docker')) return '🐳';
    if (name.includes('kubernetes') || name.includes('k8s')) return '☸️';
    if (name.includes('analytics')) return '📊';
    if (name.includes('search')) return '🔍';
    
    return '⚙️';
}

// Get transport information
function getTransportInfo(server) {
    if (server.remotes && server.remotes.length > 0) {
        return server.remotes[0].type || 'remote';
    }
    if (server.packages && server.packages.length > 0) {
        const pkg = server.packages[0];
        return pkg.transport?.type || 'stdio';
    }
    return null;
}

// Get endpoint details
function getEndpointDetails(server) {
    if (server.remotes && server.remotes.length > 0) {
        const remote = server.remotes[0];
        return `
            <div class="detail-row">
                <span class="detail-label">Endpoint:</span>
                <a href="${escapeHtml(remote.url)}" class="server-url" target="_blank" rel="noopener">
                    ${escapeHtml(remote.url)}
                </a>
            </div>
        `;
    }
    
    if (server.packages && server.packages.length > 0) {
        const pkg = server.packages[0];
        return `
            <div class="detail-row">
                <span class="detail-label">Package:</span>
                <span>${escapeHtml(pkg.registryType || 'unknown')} - ${escapeHtml(pkg.identifier || '')}</span>
            </div>
        `;
    }
    
    return '';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show integration code modal
function showIntegration(server) {
    const modal = document.getElementById('integrationModal');
    const code = document.getElementById('integrationCode');
    
    const integrationCode = generateIntegrationCode(server);
    code.textContent = integrationCode;
    
    modal.style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('integrationModal').style.display = 'none';
}

// Copy code to clipboard
function copyCode() {
    const code = document.getElementById('integrationCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Code', 2000);
    });
}

// Generate integration code based on server type (JSON format for mcp_servers.json)
function generateIntegrationCode(server) {
    const serverTitle = server.title || 'MCP Server';
    let serverConfig;
    
    if (server.remotes && server.remotes.length > 0) {
        const remote = server.remotes[0];
        let remoteType = remote.type || 'sse';
        
        // Normalize transport type - map streamable-http to sse
        if (remoteType === 'streamable-http') {
            remoteType = 'sse';
        }
        
        const serverUrl = remote.url;
        
        serverConfig = {
            "name": serverTitle,
            "transport": remoteType,
            "url": serverUrl,
            "enabled": true
        };
    } else if (server.packages && server.packages.length > 0) {
        const pkg = server.packages[0];
        const registryType = pkg.registryType || 'unknown';
        const identifier = pkg.identifier || 'package-name';
        const transportType = pkg.transport?.type || 'stdio';
        
        // Determine command based on registry type
        let command = 'python';
        let args = [`path/to/${server.name.split('/').pop()}.py`];
        
        if (registryType === 'npm') {
            command = 'npx';
            args = ['-y', identifier];
        } else if (registryType === 'pypi') {
            command = 'python';
            args = ['-m', identifier.replace('-', '_')];
        }
        
        serverConfig = {
            "name": serverTitle,
            "transport": transportType,
            "command": command,
            "args": args,
            "enabled": true
        };
    } else {
        serverConfig = {
            "name": serverTitle,
            "transport": "stdio",
            "command": "python",
            "args": ["path/to/server.py"],
            "enabled": true
        };
    }
    
    // Wrap in servers array for complete mcp_servers.json format
    const fullConfig = {
        "servers": [serverConfig]
    };
    
    return JSON.stringify(fullConfig, null, 2);
}

// Open submit modal
function openSubmitModal() {
    const modal = document.getElementById('submitModal');
    const form = document.getElementById('serverForm');
    const output = document.getElementById('serverJsonOutput');
    
    // Reset form and hide output
    form.reset();
    form.style.display = 'block';
    output.style.display = 'none';
    toggleServerTypeFields('');
    
    modal.style.display = 'flex';
}

// Close submit modal
function closeSubmitModal() {
    document.getElementById('submitModal').style.display = 'none';
}

// Toggle server type fields
function toggleServerTypeFields(serverType) {
    const remoteFields = document.getElementById('remoteFields');
    const packageFields = document.getElementById('packageFields');
    
    // Hide all conditional fields
    remoteFields.style.display = 'none';
    packageFields.style.display = 'none';
    
    // Show relevant fields based on type
    if (serverType === 'remote') {
        remoteFields.style.display = 'block';
    } else if (serverType === 'npm' || serverType === 'pypi' || serverType === 'nuget') {
        packageFields.style.display = 'block';
    }
}

// Generate server.json
function generateServerJson() {
    // Get form values
    const serverName = document.getElementById('serverName').value.trim();
    const serverTitle = document.getElementById('serverTitle').value.trim();
    const serverDescription = document.getElementById('serverDescription').value.trim();
    const serverVersion = document.getElementById('serverVersion').value.trim();
    const serverType = document.getElementById('serverType').value;
    
    // Validate required fields
    if (!serverName || !serverTitle || !serverDescription || !serverVersion || !serverType) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Build server.json object
    const serverJson = {
        "$schema": "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
        "name": serverName,
        "title": serverTitle,
        "description": serverDescription,
        "version": serverVersion
    };
    
    // Add type-specific configuration
    if (serverType === 'remote') {
        const remoteType = document.getElementById('remoteType').value;
        const remoteUrl = document.getElementById('remoteUrl').value.trim();
        
        if (!remoteUrl) {
            alert('Please enter the server URL');
            return;
        }
        
        serverJson.remotes = [
            {
                "type": remoteType,
                "url": remoteUrl
            }
        ];
    } else {
        const packageIdentifier = document.getElementById('packageIdentifier').value.trim();
        const packageVersion = document.getElementById('packageVersion').value.trim();
        const transportType = document.getElementById('transportType').value;
        
        if (!packageIdentifier || !packageVersion) {
            alert('Please enter package identifier and version');
            return;
        }
        
        serverJson.packages = [
            {
                "registryType": serverType,
                "identifier": packageIdentifier,
                "version": packageVersion,
                "transport": {
                    "type": transportType
                }
            }
        ];
    }
    
    // Display generated JSON
    const generatedJson = document.getElementById('generatedJson');
    generatedJson.textContent = JSON.stringify(serverJson, null, 2);
    
    // Hide form and show output
    document.getElementById('serverForm').style.display = 'none';
    document.getElementById('serverJsonOutput').style.display = 'block';
}

// Copy server.json to clipboard
function copyServerJson() {
    const json = document.getElementById('generatedJson').textContent;
    navigator.clipboard.writeText(json).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = originalText, 2000);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const integrationModal = document.getElementById('integrationModal');
    const submitModal = document.getElementById('submitModal');
    
    if (event.target === integrationModal) {
        closeModal();
    }
    if (event.target === submitModal) {
        closeSubmitModal();
    }
}
