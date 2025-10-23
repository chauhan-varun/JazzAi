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

// Import config
import config from './config/config.mongo.js';

// Create Express app
const app = express();
const PORT = config.server.port;

// Configure middleware
app.use(cors());
app.use(bodyParser.json());

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
    console.log('Database connected successfully');
    
    // Initialize scheduler service
    schedulerService.initialize();
    console.log('Scheduler initialized');
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 JazzAI Server (Multi-User) running on port ${PORT}`);
      console.log(`📱 WhatsApp webhook ready at: http://localhost:${PORT}/webhook`);
    });
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      schedulerService.stopAllJobs();
      await database.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();