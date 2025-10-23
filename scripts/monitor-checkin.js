/**
 * Monitor script for check-in scheduler
 * This will run continuously and check if the scheduler is working properly
 */

import dotenv from 'dotenv';
import config from '../config/config.mongo.js';
import database from '../services/databaseService.js';

// Load environment variables
dotenv.config();

async function monitorScheduler() {
  try {
    // Connect to MongoDB
    await database.connect();
    console.log('Connected to MongoDB');
    
    console.log('Starting monitor for check-in scheduler...');
    console.log(`Check-in schedule: ${config.scheduler.checkInSchedule}`);
    console.log(`Inactivity threshold: ${config.memory.inactivityThreshold} minute(s)`);
    
    // Import schedulerService after connecting to MongoDB
    const { default: schedulerService } = await import('../services/schedulerService.mongo.js');
    
    // Restart the check-in job to ensure it's using the latest config
    schedulerService.startCheckInJob();
    console.log('Check-in job restarted');
    
    // Keep process running to monitor logs
    console.log('Monitoring for check-in events (press Ctrl+C to exit)...');
    
  } catch (error) {
    console.error('Error in monitor:', error);
    process.exit(1);
  }
}

// Run the function
monitorScheduler();