#!/bin/bash

# Interactive Webhook Configuration Helper

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║       🚀 WhatsApp Webhook Configuration Helper                ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "Step 1: Checking server status..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is NOT running!"
    echo ""
    echo "Please start your server first:"
    echo "  pnpm dev"
    echo ""
    exit 1
fi
echo ""

# Check if tunnel is running
echo "Step 2: Checking tunnel status..."
if ps aux | grep -v grep | grep -q "cloudflared.*tunnel"; then
    echo "✅ Cloudflared tunnel is running"
    echo ""
    echo "⚠️  Check the terminal where you started the tunnel"
    echo "⚠️  Copy the URL (ends with .trycloudflare.com)"
else
    echo "❌ Tunnel is NOT running!"
    echo ""
    echo "📋 ACTION REQUIRED: Open a NEW terminal and run:"
    echo ""
    echo "    cd /home/varun/web2/jazzAi"
    echo "    ./start-tunnel.sh"
    echo ""
    echo "Then copy the URL that appears and come back here."
    echo ""
    read -p "Press Enter when tunnel is running and you have the URL..."
fi
echo ""

# Ask for tunnel URL
echo "════════════════════════════════════════════════════════════════"
echo ""
read -p "📋 Enter your tunnel URL (e.g., https://xyz.trycloudflare.com): " TUNNEL_URL
echo ""

# Validate URL
if [[ ! "$TUNNEL_URL" =~ ^https:// ]]; then
    echo "❌ URL must start with https://"
    exit 1
fi

# Test the URL
echo "Testing your tunnel URL..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$TUNNEL_URL/")

if [ "$HEALTH_CHECK" == "200" ]; then
    echo "✅ Tunnel is accessible!"
else
    echo "❌ Cannot reach tunnel (HTTP $HEALTH_CHECK)"
    echo "Please check the URL and try again."
    exit 1
fi
echo ""

# Provide configuration details
echo "════════════════════════════════════════════════════════════════"
echo "          🌐 WEBHOOK CONFIGURATION DETAILS"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Use these values in Meta for Developers:"
echo ""
echo "1. Callback URL:"
echo "   $TUNNEL_URL/webhook"
echo ""
echo "2. Verify Token:"
echo "   jazzai-webhook-verification"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📝 INSTRUCTIONS:"
echo ""
echo "1. Open: https://developers.facebook.com/apps"
echo ""
echo "2. Select your WhatsApp app"
echo ""
echo "3. Go to: WhatsApp → Configuration"
echo ""
echo "4. Click 'Edit' under Webhook"
echo ""
echo "5. Copy-paste the values above"
echo ""
echo "6. Click 'Verify and Save'"
echo ""
echo "7. Subscribe to 'messages' field"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
read -p "Press Enter when you've completed the configuration..."
echo ""

# Test webhook
echo "🧪 Testing your webhook configuration..."
echo ""

# Test verification
echo "Test 1: Webhook Verification"
VERIFY_RESULT=$(curl -s "$TUNNEL_URL/webhook?hub.mode=subscribe&hub.verify_token=jazzai-webhook-verification&hub.challenge=TEST123")

if [ "$VERIFY_RESULT" == "TEST123" ]; then
    echo "✅ Webhook verification works!"
else
    echo "❌ Webhook verification failed"
    echo "Response: $VERIFY_RESULT"
fi
echo ""

# Test message endpoint
echo "Test 2: Sending test message to webhook"
TEST_RESPONSE=$(curl -s -X POST "$TUNNEL_URL/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "+15551781135",
            "id": "test_'"$(date +%s)"'",
            "type": "text",
            "text": {
              "body": "Test message from configuration script"
            },
            "timestamp": "'"$(date +%s)"'"
          }]
        }
      }]
    }]
  }')

if [ "$TEST_RESPONSE" == "EVENT_RECEIVED" ]; then
    echo "✅ Webhook is receiving messages!"
    echo ""
    echo "Check your server terminal - you should see:"
    echo "  === WEBHOOK RECEIVED ==="
else
    echo "⚠️  Unexpected response: $TEST_RESPONSE"
fi
echo ""

echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🎉 SETUP COMPLETE!"
echo ""
echo "📱 Now send a WhatsApp message to your business number to test!"
echo ""
echo "You should:"
echo "  1. See webhook logs in your server terminal"
echo "  2. Receive an AI response on WhatsApp"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📖 For troubleshooting, check: WEBHOOK_SETUP_GUIDE.md"
echo ""

