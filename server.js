/**
 * JazzAI - WhatsApp AI Companion
 * Main Server File
 */

// Load environment variables
import 'dotenv/config';

// Import dependencies
import express from 'express';
import { Logger, ErrorHandler } from './utils/utils.js';
import config from './config/config.js';
import webhookController from './controllers/webhookController.js';
import schedulerService from './services/schedulerService.js';
import memoryService from './services/memoryService.js';
import whatsappService from './services/whatsappService.js';

// Create Express app
const app = express();
const PORT = config.server.port;

// Middleware to parse JSON
app.use(express.json());

// Middleware to log requests
app.use((req, res, next) => {
  Logger.info(`${req.method} ${req.url}`, {
    body: req.method === 'POST' ? '(request body omitted)' : undefined,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    }
  });
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'JazzAI WhatsApp Companion is running',
    version: '1.0.0'
  });
});

// WhatsApp webhook verification endpoint (GET)
app.get('/webhook', (req, res) => {
  webhookController.verifyWebhook(req, res);
});

// WhatsApp webhook message receipt endpoint (POST)
app.post('/webhook', (req, res) => {
  webhookController.receiveMessage(req, res);
});

// Admin endpoints (would require authentication in production)

// Test endpoint to send a message manually
app.post('/api/send-message', async (req, res) => {
  try {
    const { message, phoneNumber } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await whatsappService.sendMessage(
      message,
      phoneNumber || config.whatsapp.recipient
    );
    
    res.status(200).json({ success: true, result });
  } catch (error) {
    Logger.error('Error sending test message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get memory information
app.get('/api/memory', async (req, res) => {
  try {
    const memory = await memoryService.getFullMemory();
    res.status(200).json(memory);
  } catch (error) {
    Logger.error('Error getting memory:', error);
    res.status(500).json({ error: 'Failed to get memory' });
  }
});

// Error handling middleware
app.use(ErrorHandler.expressErrorHandler);

// Start the server
const server = app.listen(PORT, async () => {
  Logger.info(`JazzAI WhatsApp Companion is listening on port ${PORT}`);
  
  // Initialize memory service
  try {
    await memoryService.initializeMemory();
    Logger.info('Memory service initialized successfully');
  } catch (error) {
    Logger.error('Failed to initialize memory service:', error);
  }
  
  // Start the scheduler
  try {
    schedulerService.initialize();
    Logger.info('Scheduler initialized successfully');
  } catch (error) {
    Logger.error('Failed to initialize scheduler:', error);
  }
  
  Logger.info('Server startup complete. JazzAI is ready!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop scheduler jobs
  schedulerService.stopAllJobs();
  
  // Close server
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully');
  
  // Stop scheduler jobs
  schedulerService.stopAllJobs();
  
  // Close server
  server.close(() => {
    Logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught exception:', error);
  // Keep running in production, but exit in development to fix errors
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});