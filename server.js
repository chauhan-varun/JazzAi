/**
 * JazzAI Server - Multi-user MongoDB Version
 * Main entry point for the WhatsApp AI Chatbot application
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';

// Import services
import database from './services/databaseService.js';
import schedulerService from './services/schedulerService.mongo.js';

// Import controllers
import webhookController from './controllers/webhookController.mongo.js';

// Import config and utils
import config from './config/config.mongo.js';
import { Logger, ErrorHandler } from './utils/utils.mongo.js';

// Create Express app
const app = express();
const PORT = config.server.port;

// Configure middleware
app.use(cors());
app.use(bodyParser.json());
app.use(ErrorHandler.expressErrorHandler);

// Add request logging middleware (without storing message content)
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
    
    // Initialize scheduler service
    schedulerService.initialize();
    Logger.info('Scheduler initialized');
    
    // Start Express server
    app.listen(PORT, () => {
      Logger.info(`🚀 JazzAI Server (Multi-User) running on port ${PORT}`);
      Logger.info(`📱 WhatsApp webhook ready at: http://localhost:${PORT}/webhook`);
    });
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      Logger.info('Shutting down server...');
      schedulerService.stopAllJobs();
      await database.disconnect();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      Logger.info('SIGTERM received, shutting down gracefully');
      schedulerService.stopAllJobs();
      await database.disconnect();
      process.exit(0);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception:', error);
      process.exit(1);
    });
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();