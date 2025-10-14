# Deploy both MCP Registry and MCP Collection UI to Google Cloud Run
# PowerShell script for Windows

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "MCP Registry & UI Deployment Script" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "Error: gcloud CLI is not installed" -ForegroundColor Yellow
    Write-Host "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Get current project
$PROJECT_ID = gcloud config get-value project 2>$null
if ([string]::IsNullOrEmpty($PROJECT_ID)) {
    Write-Host "Error: No GCP project is set" -ForegroundColor Yellow
    Write-Host "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
}

Write-Host "Using GCP Project: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Ask which service to deploy
Write-Host "What would you like to deploy?"
Write-Host "1) Registry only"
Write-Host "2) UI only"
Write-Host "3) Both (Registry first, then UI)"
$choice = Read-Host "Enter choice [1-3]"

switch ($choice) {
    "1" {
        Write-Host "Deploying Registry..." -ForegroundColor Blue
        gcloud builds submit --config cloudbuild.yaml
        Write-Host "Registry deployed successfully!" -ForegroundColor Green
    }
    "2" {
        Write-Host "Deploying UI..." -ForegroundColor Blue
        
        # Get registry URL
        $REGISTRY_URL = gcloud run services describe mcp-registry --region=us-central1 --format="value(status.url)" 2>$null
        
        if ([string]::IsNullOrEmpty($REGISTRY_URL)) {
            Write-Host "Warning: Could not find deployed registry" -ForegroundColor Yellow
            $REGISTRY_URL = Read-Host "Enter your registry URL (e.g., https://mcp-registry-xxxxx-uc.a.run.app)"
        } else {
            Write-Host "Found registry at: $REGISTRY_URL" -ForegroundColor Green
        }
        
        # Update cloudbuild.yaml with registry URL
        $content = Get-Content MCP_Collection/cloudbuild.yaml -Raw
        $content = $content -replace '_REGISTRY_URL:.*', "_REGISTRY_URL: $REGISTRY_URL"
        $content | Set-Content MCP_Collection/cloudbuild.yaml.tmp
        
        gcloud builds submit --config MCP_Collection/cloudbuild.yaml.tmp
        
        # Cleanup
        Remove-Item MCP_Collection/cloudbuild.yaml.tmp
        
        Write-Host "UI deployed successfully!" -ForegroundColor Green
    }
    "3" {
        Write-Host "Deploying Registry..." -ForegroundColor Blue
        gcloud builds submit --config cloudbuild.yaml
        Write-Host "Registry deployed!" -ForegroundColor Green
        Write-Host ""
        
        # Get registry URL
        $REGISTRY_URL = gcloud run services describe mcp-registry --region=us-central1 --format="value(status.url)"
        Write-Host "Registry URL: $REGISTRY_URL" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Deploying UI..." -ForegroundColor Blue
        
        # Update cloudbuild.yaml with registry URL
        $content = Get-Content MCP_Collection/cloudbuild.yaml -Raw
        $content = $content -replace '_REGISTRY_URL:.*', "_REGISTRY_URL: $REGISTRY_URL"
        $content | Set-Content MCP_Collection/cloudbuild.yaml.tmp
        
        gcloud builds submit --config MCP_Collection/cloudbuild.yaml.tmp
        
        # Cleanup
        Remove-Item MCP_Collection/cloudbuild.yaml.tmp
        
        Write-Host "UI deployed successfully!" -ForegroundColor Green
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Show service URLs
if ($choice -eq "1" -or $choice -eq "3") {
    $REGISTRY_URL = gcloud run services describe mcp-registry --region=us-central1 --format="value(status.url)" 2>$null
    Write-Host "Registry URL: " -NoNewline -ForegroundColor Green
    Write-Host $REGISTRY_URL
}

if ($choice -eq "2" -or $choice -eq "3") {
    $UI_URL = gcloud run services describe mcp-collection-ui --region=us-central1 --format="value(status.url)" 2>$null
    Write-Host "UI URL: " -NoNewline -ForegroundColor Green
    Write-Host $UI_URL
}

Write-Host ""
