#!/bin/bash

# Test webhook locally
# Usage: ./test-webhook.sh [url]

URL="${1:-http://localhost:3000}"

echo "Testing webhook at: $URL/webhook"
echo ""

# Test 1: GET request (verification)
echo "Test 1: Webhook Verification (GET)"
echo "-----------------------------------"
curl -X GET "$URL/webhook?hub.mode=subscribe&hub.verify_token=jazzai-webhook-verification&hub.challenge=test123"
echo ""
echo ""

# Test 2: POST request (message)
echo "Test 2: Incoming Message (POST)"
echo "--------------------------------"
curl -X POST "$URL/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "'${USER_NUMBER:-+5551XXXXXXXXX}'",
            "id": "test_message_id",
            "type": "text",
            "text": {
              "body": "Hello, this is a test message"
            },
            "timestamp": "'$(date +%s)'"
          }]
        }
      }]
    }]
  }'
echo ""
echo ""

echo "Check your server logs to see if the webhook was received!"
echo "Look for: === WEBHOOK RECEIVED ==="

