# JazzAI - WhatsApp AI Companion with MongoDB

JazzAI is a WhatsApp-based AI companion that uses the Perplexity API to provide natural, personalized conversations. This MongoDB-powered version supports multiple users simultaneously, with improved scalability and data management.

## Features

- 🤖 Powered by Perplexity API with human-like, casual conversation style
- 💬 Real-time responses to WhatsApp messages for multiple users
- 🧠 MongoDB-based memory system for scalable user data storage
- 💬 Casual, emoji-rich texting style that feels like chatting with a friend
- ⏰ Automatic check-in messages when users haven't been active
- 🎯 Personalized conversations based on user history and preferences
- 📱 Multi-user support - works with any WhatsApp user who messages the system
- 🔒 Improved data isolation and privacy between users

## Project Structure

```
jazzAi/
├── config/                # Configuration files
│   └── config.js          # Main configuration 
├── controllers/           # Request handlers
│   └── webhookController.js
├── logs/                  # System logs (no user data)
├── models/                # MongoDB data models
│   ├── conversation.js    # Message history schema
│   ├── insight.js         # User interaction patterns schema
│   ├── reminder.js        # User reminder schema
│   └── userProfile.js     # User profile schema
├── services/              # Business logic
│   ├── memoryService.js   # Handles MongoDB data operations
│   ├── perplexity.js      # Interfaces with Perplexity API
│   ├── schedulerService.js  # Handles scheduled tasks
│   └── whatsappService.js   # Interfaces with WhatsApp API
├── utils/                 # Helper utilities
│   └── utils.js           # Logging and error handling
├── scripts/               # Utility scripts
│   ├── refresh-whatsapp-token.js  # Help with token renewal
│   └── test-auto-checkin.js      # Test automated messages
├── .env                   # Environment variables (not committed)
├── package.json           # Project dependencies
├── server.js              # Main application entry point
└── README.md              # Project documentation
```

## Recent Improvements

### Migration to MongoDB
- Replaced JSON file storage with MongoDB database
- Added proper data models and schemas
- Implemented better data isolation between users
- Optimized for performance and scalability

### Multi-User Support
- Removed dependency on hardcoded user numbers
- Dynamic user profile creation for new contacts
- Message routing based on sender phone number
- Privacy between different users' conversations

### Improved AI Conversation
- Updated to use Perplexity API instead of OpenAI
- Enhanced personalization based on user history
- Implemented more natural, casual texting style
- Added emojis and casual language patterns

### Enhanced Check-in System
- Configurable check-in schedules via environment variables
- Adjustable inactivity threshold
- More personalized automatic messages
- Better timing to avoid message flooding

### System Security & Privacy
- Removed sensitive data from log files
- Added proper data isolation in MongoDB
- Implemented better error handling
- Added support for secure HTTPS connections

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- MongoDB installed or MongoDB Atlas account
- WhatsApp Business Account with Cloud API access
- Perplexity API key
- Domain with HTTPS for webhook (required by WhatsApp)

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
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   WHATSAPP_TOKEN=your_whatsapp_token_here
   PHONE_NUMBER_ID=your_phone_number_id_here
   MONGODB_URI=mongodb://localhost:27017/jazzai
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

### Setting up MongoDB

1. Install MongoDB locally or use MongoDB Atlas
2. Configure your connection string in the `.env` file
3. The application will automatically create the necessary collections

### Setting up HTTPS for WhatsApp Webhook

1. Point your domain to your server's IP address
2. Install Nginx and obtain SSL certificate:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```
3. Configure Nginx to proxy requests to your application

### WhatsApp API Configuration

1. Configure webhook URL in Meta Developer Portal: `https://yourdomain.com/webhook`
2. Subscribe to necessary webhook fields: `messages`
3. Use the refresh token script or system user token to handle token expiration

## Scheduled Tasks

JazzAI includes several scheduled tasks:

- **User Check-ins**: Sends messages to inactive users (configurable schedule)
- **Reminders**: Processes any user-requested reminders (every 5 minutes)

## Deploying with PM2

For production deployment:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name jazzai

# Make it start on system boot
pm2 startup
pm2 save
```

## API Endpoints

- `GET /webhook` - WhatsApp webhook verification
- `POST /webhook` - Receive WhatsApp messages
- `GET /health` - Health check endpoint that returns server status

## Troubleshooting

### WhatsApp Token Expiration
The WhatsApp Business API token typically expires every 24 hours. To address this:

1. Use the included token refresh script:
   ```bash
   node scripts/refresh-whatsapp-token.js
   ```

2. Or create a permanent token in the Meta Developer Portal by:
   - Creating a System User with appropriate permissions
   - Generating a token with "Never Expires" option

### Testing Check-ins
To test the automatic check-in functionality without waiting:

1. Modify the check-in schedule in `.env`:
   ```
   CHECK_IN_SCHEDULE=* * * * *  # Run every minute
   INACTIVITY_THRESHOLD=2        # Check-in after 2 minutes
   ```

2. Or use the test script:
   ```bash
   node test-auto-checkin.js
   ```

## License

ISC