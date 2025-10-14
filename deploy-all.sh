#!/bin/bash
# Deploy both MCP Registry and MCP Collection UI to Google Cloud Run

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MCP Registry & UI Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Error: No GCP project is set${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${GREEN}Using GCP Project: $PROJECT_ID${NC}"
echo ""

# Ask which service to deploy
echo "What would you like to deploy?"
echo "1) Registry only"
echo "2) UI only"
echo "3) Both (Registry first, then UI)"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${BLUE}Deploying Registry...${NC}"
        gcloud builds submit --config cloudbuild.yaml
        echo -e "${GREEN}Registry deployed successfully!${NC}"
        ;;
    2)
        echo -e "${BLUE}Deploying UI...${NC}"
        
        # Get registry URL
        REGISTRY_URL=$(gcloud run services describe mcp-registry --region=us-central1 --format="value(status.url)" 2>/dev/null)
        
        if [ -z "$REGISTRY_URL" ]; then
            echo -e "${YELLOW}Warning: Could not find deployed registry${NC}"
            read -p "Enter your registry URL (e.g., https://mcp-registry-xxxxx-uc.a.run.app): " REGISTRY_URL
        else
            echo -e "${GREEN}Found registry at: $REGISTRY_URL${NC}"
        fi
        
        # Update cloudbuild.yaml with registry URL
        sed -i.bak "s|_REGISTRY_URL:.*|_REGISTRY_URL: $REGISTRY_URL|" MCP_Collection/cloudbuild.yaml
        
        gcloud builds submit --config MCP_Collection/cloudbuild.yaml
        
        # Restore backup
        mv MCP_Collection/cloudbuild.yaml.bak MCP_Collection/cloudbuild.yaml
        
        echo -e "${GREEN}UI deployed successfully!${NC}"
        ;;
    3)
        echo -e "${BLUE}Deploying Registry...${NC}"
        gcloud builds submit --config cloudbuild.yaml
        echo -e "${GREEN}Registry deployed!${NC}"
        echo ""
        
        # Get registry URL
        REGISTRY_URL=$(gcloud run services describe mcp-registry --region=us-central1 --format="value(status.url)")
        echo -e "${GREEN}Registry URL: $REGISTRY_URL${NC}"
        echo ""
        
        echo -e "${BLUE}Deploying UI...${NC}"
        
        # Update cloudbuild.yaml with registry URL
        sed -i.bak "s|_REGISTRY_URL:.*|_REGISTRY_URL: $REGISTRY_URL|" MCP_Collection/cloudbuild.yaml
        
        gcloud builds submit --config MCP_Collection/cloudbuild.yaml
        
        # Restore backup
        mv MCP_Collection/cloudbuild.yaml.bak MCP_Collection/cloudbuild.yaml
        
        echo -e "${GREEN}UI deployed successfully!${NC}"
        ;;
    *)
        echo -e "${YELLOW}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Show service URLs
if [ "$choice" = "1" ] || [ "$choice" = "3" ]; then
    REGISTRY_URL=$(gcloud run services describe mcp-registry --region=us-central1 --format="value(status.url)" 2>/dev/null)
    echo -e "${GREEN}Registry URL:${NC} $REGISTRY_URL"
fi

if [ "$choice" = "2" ] || [ "$choice" = "3" ]; then
    UI_URL=$(gcloud run services describe mcp-collection-ui --region=us-central1 --format="value(status.url)" 2>/dev/null)
    echo -e "${GREEN}UI URL:${NC} $UI_URL"
fi

echo ""
