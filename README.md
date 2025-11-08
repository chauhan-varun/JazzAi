# Luna AI - WhatsApp Customer Support Bot

A full-stack AI-powered WhatsApp customer support system with agent handoff dashboard built with Next.js, MongoDB, and Perplexity AI.

## Features

- 🤖 **AI-Powered Bot**: Friendly, human-like responses using Perplexity AI
- 📚 **Smart FAQ Search**: TF-IDF search with MongoDB Atlas Search fallback
- 💬 **Agent Handoff**: Seamless transition from bot to human agent
- 🔄 **Real-time Chat**: Socket.io for live updates and presence
- 📱 **WhatsApp Integration**: Cloud API webhook support
- 🎨 **Modern UI**: Beautiful dashboard with Tailwind CSS & shadcn/ui
- 📞 **WebRTC Support**: Optional video/audio calls for live support
- 🔐 **Secure Auth**: Iron-session with bcrypt password hashing

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Socket.io
- **Database**: MongoDB with Drizzle ORM
- **AI**: Perplexity API (llama-3.1-sonar-small-128k-online)
- **Messaging**: WhatsApp Cloud API
- **UI**: shadcn/ui components

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp Cloud API token
- `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp Business phone number ID
- `WHATSAPP_VERIFY_TOKEN`: Webhook verification token (choose any secure string)
- `PERPLEXITY_API_KEY`: Perplexity AI API key
- `NEXTAUTH_SECRET`: Session encryption key (generate with `openssl rand -base64 32`)
- `DASHBOARD_JWT_SECRET`: JWT signing key

### 3. Seed Database

```bash
pnpm seed
```

This creates:
- Admin user: `admin@luna.ai` / `admin123`
- Agent user: `agent@luna.ai` / `password123`
- 8 sample FAQs
- 1 demo customer with messages

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Configure WhatsApp Webhook

1. Expose your local server using ngrok or similar:
   ```bash
   ngrok http 3000
   ```

2. In WhatsApp Business API settings, set webhook URL to:
   ```
   https://your-ngrok-url.ngrok.io/api/whatsapp/webhook
   ```

3. Set verify token to match your `WHATSAPP_VERIFY_TOKEN`

4. Subscribe to `messages` webhook events

## Project Structure

```
luna-ai/
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication endpoints
│   │   ├── whatsapp/       # WhatsApp webhook
│   │   ├── customers/      # Customer management
│   │   ├── messages/       # Message history
│   │   ├── handoff/        # Agent handoff control
│   │   ├── agent-message/  # Send messages as agent
│   │   └── faqs/           # FAQ CRUD
│   ├── dashboard/          # Dashboard pages
│   │   ├── inbox/          # Chat interface
│   │   ├── faq/            # FAQ management
│   │   └── settings/       # Configuration
│   └── login/              # Login page
├── lib/
│   ├── db/                 # Drizzle schema & connection
│   ├── services/           # Business logic
│   ├── faq/                # FAQ search engine
│   ├── model/              # Perplexity AI integration
│   ├── whatsapp/           # WhatsApp API client
│   ├── socket/             # Socket.io server & emitters
│   ├── auth/               # Session management
│   └── webrtc/             # WebRTC signaling
├── components/ui/          # shadcn components
└── server.ts               # Custom server with Socket.io
```

## Bot Flow

```
WhatsApp Message → Webhook → Check Handoff Status
                                    ↓
                         ┌─────────┴──────────┐
                         ↓                     ↓
                   Handoff Active       Handoff Inactive
                         ↓                     ↓
                  Route to Agent         Search FAQ
                         ↓                     ↓
                  Agent Replies          ┌────┴─────┐
                                         ↓          ↓
                                    FAQ Found   No FAQ
                                         ↓          ↓
                              Perplexity Rewrite  Suggest Handoff
                                         ↓
                              Send WhatsApp Reply
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### WhatsApp
- `GET /api/whatsapp/webhook` - Verify webhook
- `POST /api/whatsapp/webhook` - Receive messages

### Dashboard
- `GET /api/customers` - List customers
- `GET /api/messages/:customerId` - Get messages
- `POST /api/handoff` - Toggle agent handoff
- `POST /api/agent-message` - Send message as agent
- `GET /api/faqs` - List FAQs
- `POST /api/faqs` - Create FAQ
- `PUT /api/faqs` - Update FAQ
- `DELETE /api/faqs` - Delete FAQ

## Socket.io Events

### Client → Server
- `agent:join` - Join agent room
- `customer:join` - Join customer room
- `agent:message` - Send message
- `handoff:start` - Start handoff
- `handoff:end` - End handoff
- `rtc:offer/answer/ice-candidate` - WebRTC signaling

### Server → Client
- `message` - New message
- `agent:status` - Agent online/offline
- `handoff:active` - Handoff status changed

## Testing

### Test FAQ Search
```bash
curl http://localhost:3000/api/faqs
```

### Test WhatsApp Webhook Verification
```bash
curl "http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

## Production Deployment

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start production server:
   ```bash
   pnpm start
   ```

3. Set up MongoDB Atlas or managed MongoDB instance

4. Configure production environment variables

5. Set up proper WhatsApp webhook with SSL certificate

## License

MIT
