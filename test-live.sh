#!/bin/bash

# Test your live webhook with your tunnel URL
# Usage: ./test-live.sh https://your-tunnel-url.trycloudflare.com

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your tunnel URL"
    echo ""
    echo "Usage: ./test-live.sh https://your-tunnel-url.trycloudflare.com"
    echo ""
    exit 1
fi

TUNNEL_URL="$1"

echo "════════════════════════════════════════════════════════════"
echo "  Testing WhatsApp Webhook at: $TUNNEL_URL"
echo "════════════════════════════════════════════════════════════"
echo ""

# Test 1: Health check
echo "Test 1: Server Health Check"
echo "─────────────────────────────"
HEALTH=$(curl -s "$TUNNEL_URL/")
if echo "$HEALTH" | grep -q "JazzAI"; then
    echo "✅ Server is accessible!"
    echo "$HEALTH" | jq '.'
else
    echo "❌ Server is not accessible"
    echo "$HEALTH"
fi
echo ""

# Test 2: Webhook verification
echo "Test 2: Webhook Verification (GET)"
echo "───────────────────────────────────"
VERIFY=$(curl -s "$TUNNEL_URL/webhook?hub.mode=subscribe&hub.verify_token=jazzai-webhook-verification&hub.challenge=test12345")
if [ "$VERIFY" == "test12345" ]; then
    echo "✅ Webhook verification works!"
    echo "Response: $VERIFY"
else
    echo "❌ Webhook verification failed"
    echo "Response: $VERIFY"
fi
echo ""

# Test 3: Send test message
echo "Test 3: Sending Test Message (POST)"
echo "────────────────────────────────────"
curl -X POST "$TUNNEL_URL/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "+15551781135",
            "id": "test_msg_'"$(date +%s)"'",
            "type": "text",
            "text": {
              "body": "Hello! This is a test message from the diagnostic script."
            },
            "timestamp": "'"$(date +%s)"'"
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✅ Tests Complete!"
echo ""
echo "Check your server terminal for:"
echo "  === WEBHOOK RECEIVED ==="
echo "  ✓ Valid WhatsApp message detected"
echo ""
echo "You should also receive an AI response!"
echo "════════════════════════════════════════════════════════════"

