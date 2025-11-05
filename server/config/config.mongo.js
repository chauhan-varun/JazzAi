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
    // For real deployment: '0 8,11,14,17,20 * * *'
    // For testing: Run every minute
    checkInSchedule: process.env.CHECK_IN_SCHEDULE || '* * * * *',
    // Check for reminders every 5 minutes
    reminderCheckSchedule: process.env.REMINDER_CHECK_SCHEDULE || '*/5 * * * *'
  },
  
  // Memory configuration
  memory: {
    // For real deployment: 180 (3 hours)
    // For testing: 3 minutes
    inactivityThreshold: process.env.INACTIVITY_THRESHOLD ? parseInt(process.env.INACTIVITY_THRESHOLD) : 3
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