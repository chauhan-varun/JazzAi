/**
 * Application Configuration with MongoDB Support
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000
  },
  
  // WhatsApp configuration
  whatsapp: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'jazzai-webhook-verification',
    apiVersion: 'v17.0'
  },
  
  // OpenAI configuration
  openai: {
    defaultModel: 'sonar-pro',
    defaultTemperature: 0.8
  },
  
  // Scheduler configuration
  scheduler: {
    // Default: 8am, 11am, 2pm, 5pm, 8pm
    checkInSchedule: process.env.CHECK_IN_SCHEDULE || '0 8,11,14,17,20 * * *',
    // Check for reminders every 5 minutes
    reminderCheckSchedule: process.env.REMINDER_CHECK_SCHEDULE || '*/5 * * * *'
  },
  
  // Memory configuration
  memory: {
    inactivityThreshold: 180 // Minutes of inactivity before sending check-in message
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jazzai',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  }
};

export default config;