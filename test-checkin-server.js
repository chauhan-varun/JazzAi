/**
 * Script to start the server with a 1-minute check-in schedule for testing
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cron from 'node-cron';
import config from './config/config.mongo.js';
import database from './services/databaseService.js';
import webhookController from './controllers/webhookController.mongo.js';
import { Logger, ErrorHandler } from './utils/utils.mongo.js';

// Load environment variables
dotenv.config();

// Override configuration for testing
config.scheduler.checkInSchedule = '* * * * *'; // Run every minute
config.memory.inactivityThreshold = 1; // Check-in after 1 minute of inactivity

// Create Express app
const app = express();
const PORT = config.server.port;

// Configure middleware
app.use(cors());
app.use(bodyParser.json());
app.use(ErrorHandler.expressErrorHandler);

// Add request logging middleware
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check route
app.get('/health', webhookController.healthCheck);

// WhatsApp webhook routes
app.get('/webhook', webhookController.verifyWebhook);
app.post('/webhook', webhookController.handleWebhook);

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    Logger.info('Database connected successfully');
    
    // Override schedulerService to log more information
    const schedulerService = (await import('./services/schedulerService.mongo.js')).default;
    
    // Create a custom job that runs every minute
    const checkEveryMinute = cron.schedule('* * * * *', async () => {
      Logger.info('⏰ Running manual check-in job (every minute)');
      
      try {
        // Get active users
        const whatsappService = (await import('./services/whatsappService.mongo.js')).default;
        const activeUsers = await whatsappService.getActiveUsers();
        Logger.info(`Found ${activeUsers.length} active users`);
        
        // Process each user
        for (const user of activeUsers) {
          // Get time since last interaction
          const memoryService = (await import('./services/memoryService.mongo.js')).default;
          const timeSinceLastInteraction = await memoryService.getTimeSinceLastInteraction(user.phoneNumber);
          Logger.info(`User ${user.phoneNumber.slice(-4)}: Last interaction ${timeSinceLastInteraction} minutes ago`);
          
          if (timeSinceLastInteraction > config.memory.inactivityThreshold) {
            Logger.info(`Sending check-in to ${user.phoneNumber.slice(-4)}`);
            const openaiService = (await import('./services/perplexity.mongo.js')).default;
            const checkInMessage = await openaiService.generateCheckInMessage(user.phoneNumber);
            await whatsappService.sendMessage(checkInMessage, user.phoneNumber);
            Logger.info(`Check-in sent to ${user.phoneNumber.slice(-4)}`);
          }
        }
      } catch (error) {
        Logger.error('Error in manual check-in job:', error);
      }
    });
    
    // Initialize the regular scheduler
    schedulerService.initialize();
    Logger.info('Scheduler initialized with custom schedule');
    Logger.info(`Check-in schedule: ${config.scheduler.checkInSchedule}`);
    Logger.info(`Inactivity threshold: ${config.memory.inactivityThreshold} minute(s)`);
    Logger.info('Added additional every-minute check-in job for testing');
    
    // Start Express server
    app.listen(PORT, () => {
      Logger.info(`🚀 JazzAI Testing Server running on port ${PORT}`);
      Logger.info(`📱 WhatsApp webhook ready at: http://localhost:${PORT}/webhook`);
    });
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();