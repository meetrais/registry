// Configuration
// Use proxied API endpoint to avoid CORS issues
const REGISTRY_API = '/api/servers';

// Always use the proxy to avoid CORS issues
const REGISTRY_URL = '/api';

// State
let allServers = [];
let filteredServers = [];
let authToken = localStorage.getItem('mcp_auth_token');
let userInfo = JSON.parse(localStorage.getItem('mcp_user_info') || 'null');
let currentServerJson = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadServers();
    setupEventListeners();
    updateAuthUI();
});

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const refreshBtn = document.getElementById('refreshBtn');
    const submitBtn = document.getElementById('submitBtn');
    const serverForm = document.getElementById('serverForm');
    const serverTypeSelect = document.getElementById('serverType');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const publishDirectBtn = document.getElementById('publishDirectBtn');
    const publishNowBtn = document.getElementById('publishNowBtn');

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

    loginBtn.addEventListener('click', () => {
        loginWithGitHub();
    });

    logoutBtn.addEventListener('click', () => {
        logout();
    });

    publishDirectBtn.addEventListener('click', () => {
        publishServerDirect();
    });

    publishNowBtn.addEventListener('click', () => {
        publishServerNow();
    });
}

// Authentication functions
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const publishDirectBtn = document.getElementById('publishDirectBtn');
    const publishNowBtn = document.getElementById('publishNowBtn');

    if (authToken && window.userInfo) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = `👤 ${window.userInfo.username || 'User'}`;
        if (publishDirectBtn) publishDirectBtn.style.display = 'inline-block';
        if (publishNowBtn) publishNowBtn.style.display = 'inline-block';
    } else {
        loginBtn.style.display = 'inline-block';
        userInfo.style.display = 'none';
        if (publishDirectBtn) publishDirectBtn.style.display = 'none';
        if (publishNowBtn) publishNowBtn.style.display = 'none';
    }
}

async function loginWithGitHub() {
    try {
        // Get GitHub Client ID from registry health endpoint
        const clientID = await getGitHubClientID();
        
        // Start GitHub Device Flow
        const deviceData = await requestGitHubDeviceCode(clientID);
        
        // Show GitHub login modal
        showGitHubLoginModal(deviceData);
        
        // Poll for GitHub access token
        const githubToken = await pollForGitHubToken(clientID, deviceData.device_code);
        
        // Get GitHub user info
        const githubUser = await getGitHubUserInfo(githubToken);
        
        // Exchange GitHub token for registry JWT
        const registryToken = await exchangeGitHubTokenForRegistry(githubToken);
        
        // Store tokens and user info
        authToken = registryToken;
        window.userInfo = { username: githubUser.login };
        
        localStorage.setItem('mcp_auth_token', authToken);
        localStorage.setItem('mcp_user_info', JSON.stringify(window.userInfo));
        
        // Update status in modal
        updateAuthStatus('✅', 'Successfully authorized!', 'success');
        
        // Wait a moment then close modal and update UI
        setTimeout(() => {
            closeGitHubLoginModal();
            updateAuthUI();
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        updateAuthStatus('❌', `Login failed: ${error.message}`, 'error');
    }
}

async function getGitHubUserInfo(githubToken) {
    const response = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to get GitHub user info');
    }
    
    return await response.json();
}

function showGitHubLoginModal(deviceData) {
    const modal = document.getElementById('githubLoginModal');
    const verifyLink = document.getElementById('githubVerifyLink');
    const verifyUrl = document.getElementById('githubVerifyUrl');
    const deviceCode = document.getElementById('githubDeviceCode');
    
    verifyLink.href = deviceData.verification_uri;
    verifyUrl.textContent = deviceData.verification_uri;
    deviceCode.textContent = deviceData.user_code;
    
    // Store device code for copying
    window.currentDeviceCode = deviceData.user_code;
    
    modal.style.display = 'flex';
}

function closeGitHubLoginModal() {
    const modal = document.getElementById('githubLoginModal');
    modal.style.display = 'none';
    
    // Reset status
    updateAuthStatus('⏳', 'Waiting for authorization...', '');
}

function updateAuthStatus(icon, message, statusClass) {
    const statusIcon = document.getElementById('authStatusIcon');
    const statusText = document.getElementById('authStatusText');
    const statusMessage = document.querySelector('.auth-status-message');
    
    statusIcon.textContent = icon;
    statusText.textContent = message;
    
    // Update status class
    statusMessage.className = 'auth-status-message';
    if (statusClass) {
        statusMessage.classList.add(statusClass);
    }
}

function copyDeviceCode() {
    const code = window.currentDeviceCode;
    if (code) {
        navigator.clipboard.writeText(code).then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = originalText, 2000);
        });
    }
}

async function getGitHubClientID() {
    const response = await fetch(`${REGISTRY_URL}/health`);
    if (!response.ok) {
        throw new Error('Failed to get GitHub Client ID from registry');
    }
    const data = await response.json();
    if (!data.github_client_id) {
        throw new Error('GitHub Client ID not configured in registry');
    }
    return data.github_client_id;
}

async function requestGitHubDeviceCode(clientID) {
    const response = await fetch('/github/device/code', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            client_id: clientID,
            scope: 'read:org read:user'
        })
    });
    
    if (!response.ok) {
        throw new Error('Failed to request device code from GitHub');
    }
    
    return await response.json();
}

async function pollForGitHubToken(clientID, deviceCode) {
    const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const response = await fetch('/github/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientID,
                device_code: deviceCode,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
            })
        });
        
        const data = await response.json();
        
        if (data.error === 'authorization_pending') {
            continue; // Keep polling
        }
        
        if (data.error) {
            throw new Error(`GitHub authorization failed: ${data.error}`);
        }
        
        if (data.access_token) {
            return data.access_token;
        }
    }
    
    throw new Error('GitHub authorization timed out');
}

async function exchangeGitHubTokenForRegistry(githubToken) {
    const response = await fetch(`${REGISTRY_URL}/auth/github-at`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            github_token: githubToken
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Token exchange failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.registry_token;
}

function logout() {
    authToken = null;
    window.userInfo = null;
    localStorage.removeItem('mcp_auth_token');
    localStorage.removeItem('mcp_user_info');
    updateAuthUI();
    alert('Logged out successfully');
}

// Direct publishing functions
async function publishServerDirect() {
    if (!authToken) {
        alert('⚠️ Please login with GitHub first to publish directly');
        return;
    }

    // Generate server.json first
    generateServerJson();
}

async function publishServerNow() {
    if (!authToken) {
        alert('⚠️ Please login with GitHub first');
        return;
    }

    if (!currentServerJson) {
        alert('⚠️ Please generate server.json first');
        return;
    }

    const publishStatus = document.getElementById('publishStatus');
    const publishNowBtn = document.getElementById('publishNowBtn');
    
    publishStatus.style.display = 'block';
    publishStatus.className = 'publish-status loading';
    publishStatus.textContent = '📤 Publishing server to registry...';
    publishNowBtn.disabled = true;

    try {
        const response = await fetch(`${REGISTRY_URL}/publish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(currentServerJson)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        publishStatus.className = 'publish-status success';
        publishStatus.textContent = '✅ Server published successfully! Refreshing server list...';
        
        // Refresh server list
        setTimeout(() => {
            loadServers();
            closeSubmitModal();
        }, 2000);

    } catch (error) {
        console.error('Publish error:', error);
        publishStatus.className = 'publish-status error';
        publishStatus.textContent = `❌ Publishing failed: ${error.message}`;
    } finally {
        publishNowBtn.disabled = false;
    }
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

    const icon = getServerIcon(server);
    const transportInfo = getTransportInfo(server);
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

// Generate integration code based on server type
function generateIntegrationCode(server) {
    const serverTitle = server.title || 'MCP Server';
    let serverConfig;
    
    if (server.remotes && server.remotes.length > 0) {
        const remote = server.remotes[0];
        let remoteType = remote.type || 'sse';
        
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
    
    const fullConfig = {
        "servers": [serverConfig]
    };
    
    return JSON.stringify(fullConfig, null, 2);
}

// Open submit modal
function openSubmitModal() {
    // Check if user is logged in
    if (!authToken) {
        alert('🔐 Please login with GitHub first to submit a new MCP server');
        return;
    }
    
    const modal = document.getElementById('submitModal');
    const form = document.getElementById('serverForm');
    const output = document.getElementById('serverJsonOutput');
    
    form.reset();
    form.style.display = 'block';
    output.style.display = 'none';
    toggleServerTypeFields('');
    currentServerJson = null;
    
    updateAuthUI();
    
    modal.style.display = 'flex';
}

// Close submit modal
function closeSubmitModal() {
    document.getElementById('submitModal').style.display = 'none';
    const publishStatus = document.getElementById('publishStatus');
    publishStatus.style.display = 'none';
}

// Toggle server type fields
function toggleServerTypeFields(serverType) {
    const remoteFields = document.getElementById('remoteFields');
    const packageFields = document.getElementById('packageFields');
    
    remoteFields.style.display = 'none';
    packageFields.style.display = 'none';
    
    if (serverType === 'remote') {
        remoteFields.style.display = 'block';
    } else if (serverType === 'npm' || serverType === 'pypi' || serverType === 'nuget') {
        packageFields.style.display = 'block';
    }
}

// Generate server.json
function generateServerJson() {
    const serverName = document.getElementById('serverName').value.trim();
    const serverTitle = document.getElementById('serverTitle').value.trim();
    const serverDescription = document.getElementById('serverDescription').value.trim();
    const serverVersion = document.getElementById('serverVersion').value.trim();
    const serverType = document.getElementById('serverType').value;
    
    if (!serverName || !serverTitle || !serverDescription || !serverVersion || !serverType) {
        alert('Please fill in all required fields');
        return;
    }
    
    const serverJson = {
        "$schema": "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json",
        "name": serverName,
        "title": serverTitle,
        "description": serverDescription,
        "version": serverVersion
    };
    
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
    
    currentServerJson = serverJson;
    
    const generatedJson = document.getElementById('generatedJson');
    generatedJson.textContent = JSON.stringify(serverJson, null, 2);
    
    const outputMessage = document.getElementById('outputMessage');
    if (authToken) {
        outputMessage.innerHTML = '✅ server.json generated! You can copy it or click "Publish Now" to publish directly to the registry.';
    } else {
        outputMessage.innerHTML = 'Copy this content to your <code>server.json</code> file and use the MCP publisher CLI to publish, or login with GitHub to publish directly.';
    }
    
    document.getElementById('serverForm').style.display = 'none';
    document.getElementById('serverJsonOutput').style.display = 'block';
    
    updateAuthUI();
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
