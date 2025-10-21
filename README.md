# JazzAI - WhatsApp AI Companion

JazzAI is a WhatsApp-based AI companion that uses OpenAI's GPT models to provide a natural, personalized conversation experience. It can respond to messages in real-time, remember user details, and send scheduled check-ins.

## Features

- 🤖 Powered by OpenAI GPT-4/GPT-4o for natural, human-like conversations
- 💬 Real-time responses to WhatsApp messages
- 🧠 Memory system that remembers user preferences, mood, and conversation history
- ⏰ Automatic check-in messages when users haven't been active
- 🎯 Personalized responses based on conversation history
- 📊 Simple insights about user interaction patterns

## Project Structure

```
jazzAi/
├── config/             # Configuration files
│   └── config.js       # Main configuration
├── controllers/        # Request handlers
│   └── webhookController.js
├── data/               # Data storage
│   └── memory.json     # User memory and conversation history
├── logs/               # Application logs (created automatically)
├── models/             # Data models (empty for now, expandable)
├── services/           # Business logic
│   ├── memoryService.js     # Handles memory operations
│   ├── openaiService.js     # Interfaces with OpenAI API
│   ├── schedulerService.js  # Handles scheduled tasks
│   └── whatsappService.js   # Interfaces with WhatsApp API
├── utils/              # Helper utilities
│   └── utils.js        # Logging and error handling
├── .env                # Environment variables (not committed)
├── .env.example        # Example environment variables
├── package.json        # Project dependencies
├── server.js           # Main application entry point
└── README.md           # Project documentation
```

## Setup Instructions

### Prerequisites

- Node.js 16+ installed
- WhatsApp Business Account with Cloud API access
- OpenAI API key
- Public URL for webhook (use ngrok for development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/jazzAi.git
   cd jazzAi
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the example environment file and configure it:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your API keys and configuration:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   WHATSAPP_TOKEN=your_whatsapp_token_here
   PHONE_NUMBER_ID=your_phone_number_id_here
   USER_NUMBER=+15551234567
   ```

### Running the Application

Start the server:

```
npm start
```

For development with auto-reload:

```
npm run dev
```

### Setting up WhatsApp Webhook

1. Make your server publicly accessible (use ngrok or a cloud server)
2. Configure webhook URL in Meta Developer Portal: `https://your-domain.com/webhook`
3. Use `jazzai-webhook-verification` as the verification token (or change it in config.js)
4. Subscribe to necessary webhook fields: `messages`

## Usage

Once set up, JazzAI will:

1. Respond to any incoming WhatsApp messages from the configured user number
2. Send automatic check-in messages at scheduled times if the user hasn't interacted recently
3. Remember details from conversations to make future interactions more personal

## API Endpoints

- `GET /webhook` - WhatsApp webhook verification
- `POST /webhook` - Receive WhatsApp messages
- `GET /` - Health check endpoint
- `POST /api/send-message` - Manual message sending (for testing)
- `GET /api/memory` - View the current memory contents

## Extending JazzAI

The modular design makes it easy to add new features:

- Add new services in the `services/` directory
- Create new controllers in the `controllers/` directory
- Extend memory structure in `memoryService.js`
- Add more sophisticated NLP in `openaiService.js`

## License

ISC