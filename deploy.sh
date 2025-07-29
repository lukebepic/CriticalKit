#!/bin/bash

# CriticalKit Theme Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: dev (default) or live

set -e

ENVIRONMENT=${1:-dev}

echo "🎲 CriticalKit Theme Deployment"
echo "================================"

# Check if Shopify CLI is installed
if ! command -v shopify &> /dev/null; then
    echo "❌ Shopify CLI is not installed. Please install it first:"
    echo "   npm install -g @shopify/cli @shopify/theme"
    exit 1
fi

# Check if we're in a valid theme directory
if [ ! -f "config/settings_schema.json" ]; then
    echo "❌ This doesn't appear to be a valid Shopify theme directory"
    exit 1
fi

echo "🔍 Checking theme for issues..."
npm run check

if [ "$ENVIRONMENT" = "live" ]; then
    echo "🚀 Deploying to LIVE store..."
    echo "⚠️  This will update your live theme. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        npm run deploy
        echo "✅ Live deployment complete!"
    else
        echo "❌ Deployment cancelled"
        exit 1
    fi
else
    echo "🛠️  Deploying to development theme..."
    npm run push
    echo "✅ Development deployment complete!"
fi

echo "🎉 Theme deployment finished!"