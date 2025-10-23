/**
 * Application Configuration
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000
  },
  
  // WhatsApp configuration
  whatsapp: {
    verifyToken: 'jazzai-webhook-verification', // Used to verify webhook
    apiVersion: 'v17.0',
    recipient: process.env.USER_NUMBER
  },
  
  // OpenAI configuration
  openai: {
    defaultModel: 'gpt-4o', // Can be changed to gpt-4 or other models
    defaultTemperature: 0.8
  },
  
  // Scheduler configuration
  scheduler: {
    checkInSchedule: process.env.CHECK_IN_SCHEDULE || '0 8,11,14,17,20 * * *' // Default: 8am, 11am, 2pm, 5pm, 8pm
  },
  
  // Memory configuration
  memory: {
    maxConversations: 50, // Maximum number of conversation entries to keep
    inactivityThreshold: 180 // Minutes of inactivity before sending check-in message
  }
};

export default config;