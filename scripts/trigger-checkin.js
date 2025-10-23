/**
 * Script to manually trigger check-in messages
 * This helps troubleshoot why automatic check-ins aren't working
 */

import dotenv from 'dotenv';
import whatsappService from '../services/whatsappService.mongo.js';
import database from '../services/databaseService.js';

// Load environment variables
dotenv.config();

async function triggerCheckIn() {
  try {
    // Connect to MongoDB
    await database.connect();
    console.log('Connected to MongoDB');
    
    // Send check-in messages to eligible users
    console.log('Triggering check-in messages...');
    const result = await whatsappService.sendCheckInMessages();
    
    console.log('Check-in result:', JSON.stringify(result, null, 2));
    
    // Disconnect
    await database.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error triggering check-in:', error);
  }
}

// Run the function
triggerCheckIn();