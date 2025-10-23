#!/bin/bash

# JazzAI - Start Public Tunnel
# This script creates a public URL for your local server

echo "================================================"
echo "  JazzAI WhatsApp - Starting Public Tunnel"
echo "================================================"
echo ""

# Check if server is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ Error: Server is not running on port 3000"
    echo "Please start your server first with: pnpm dev"
    exit 1
fi

echo "✓ Server is running on port 3000"
echo ""
echo "Starting cloudflared tunnel..."
echo "📡 Creating public HTTPS URL..."
echo ""
echo "⚠️  IMPORTANT: Copy the URL that appears below (https://xxxxx.trycloudflare.com)"
echo "⚠️  You'll need to configure this URL in Meta for Developers"
echo ""
echo "================================================"
echo ""

# Start cloudflared tunnel
cloudflared tunnel --url http://localhost:3000

# This will keep running until you press Ctrl+C

