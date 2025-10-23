# 🔧 Why Your WhatsApp Bot Isn't Working

## The Problem

You're sending messages from WhatsApp to `+5551781135` but getting no response.

## Root Causes (Found by Diagnostic)

### 🔴 Issue #1: Incomplete Phone Number
```
Current: +5551781135
Problem: Only 8 digits after country code (+55)
Required: 10-11 digits for Brazilian numbers
```

**Your phone number is MISSING 1-2 DIGITS!**

Brazilian phone format:
- `+55` = Country code
- `51` = Area code (Rio Grande do Sul)
- `XXXXXXXXX` = 8-9 digit phone number

Example correct format: `+5551987654321` (11 digits total after +55)

### 🔴 Issue #2: No Public URL
```
Current: Server running on localhost:3000 (private)
Problem: WhatsApp can't reach localhost
Required: Public HTTPS URL
```

WhatsApp Cloud API needs to send webhooks to a **publicly accessible HTTPS URL**. Your computer's localhost is not reachable from the internet.

## ✅ The Solution

I've set everything up for you. You just need to:

### 1️⃣ Fix Your Phone Number (REQUIRED)

Edit your `.env` file:
```bash
nano .env
```

Change:
```
USER_NUMBER=+5551781135
```

To your **COMPLETE** phone number (with all digits):
```
USER_NUMBER=+5551XXXXXXXXXX
```

Then restart your server:
```bash
# Press Ctrl+C to stop the current server, then:
pnpm dev
```

### 2️⃣ Start Public Tunnel (REQUIRED)

Open a **NEW terminal window** and run:
```bash
cd /home/varun/web2/jazzAi
./start-tunnel.sh
```

This will show you a URL like:
```
https://random-words-abc123.trycloudflare.com
```

**COPY THIS URL** - you'll need it in the next step.

### 3️⃣ Configure Webhook in Meta (REQUIRED)

1. Open: https://developers.facebook.com/apps
2. Select your WhatsApp Business app
3. Go to: **WhatsApp** → **Configuration**
4. Under "Webhook":
   - Click **Edit**
   - Callback URL: `https://YOUR-TUNNEL-URL.trycloudflare.com/webhook`
   - Verify token: `jazzai-webhook-verification`
   - Click **Verify and Save** (should show success)
5. Under "Webhook fields":
   - Check the box for **messages**
   - Click **Save**

### 4️⃣ Test!

Send a message from your WhatsApp to your business number. You should:
1. See in your server terminal: `=== WEBHOOK RECEIVED ===`
2. Receive an AI-generated response in WhatsApp

## What I've Done For You

✅ **Installed cloudflared** - Tool to create public tunnel  
✅ **Created `start-tunnel.sh`** - Easy script to start the tunnel  
✅ **Added detailed logging** - You'll see all webhook events clearly  
✅ **Created `test-webhook.sh`** - Test your webhook locally  
✅ **Created `diagnose.js`** - Diagnose configuration issues  
✅ **Verified your config** - WhatsApp API credentials are valid  

## Verification

After you complete the 3 steps above, run:

```bash
node diagnose.js
```

You should see all ✅ green checkmarks!

## Why This Was Happening

1. **Phone number too short**: The code checks if the sender matches `USER_NUMBER`. Since your number was incomplete, it would never match incoming messages (even if they arrived).

2. **No webhooks received**: WhatsApp was trying to send webhooks to your configured URL in Meta, but that URL was either:
   - Not configured at all, OR
   - Pointing to localhost, which WhatsApp can't reach

Your logs show NO webhook attempts, which means WhatsApp never successfully sent anything to your server.

## Common Questions

**Q: Do I need to keep the tunnel running?**  
A: Yes! When you close the terminal with the tunnel, the URL stops working. For production, deploy to Railway/Render/Heroku.

**Q: The tunnel URL keeps changing!**  
A: Yes, free tunnels change each restart. Update it in Meta each time, or deploy to production.

**Q: How do I know if it's working?**  
A: Your server logs will show `=== WEBHOOK RECEIVED ===` when messages arrive.

**Q: Can I test without sending from WhatsApp?**  
A: Yes! Run `./test-webhook.sh https://your-tunnel-url.trycloudflare.com`

## Next Steps

1. ✅ Fix phone number in `.env`
2. ✅ Start tunnel with `./start-tunnel.sh`
3. ✅ Configure webhook in Meta
4. ✅ Test by sending a WhatsApp message
5. 🎉 Enjoy your working AI bot!

---

**Need help?** Check:
- `QUICKSTART.md` - Step-by-step guide
- `SETUP_INSTRUCTIONS.md` - Detailed instructions
- Run `node diagnose.js` - Check your configuration

