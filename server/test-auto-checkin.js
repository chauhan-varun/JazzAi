/**
 * Simple script to test automatic check-in every 10 seconds
 */

import dotenv from 'dotenv';
import database from './services/databaseService.js';
import config from './config/config.mongo.js';

// Load environment variables
dotenv.config();

// Override config for testing
config.memory.inactivityThreshold = 3; // 3 minutes

async function setUserLastInteraction(minutes) {
  try {
    // Import the UserProfile model
    const UserProfile = (await import('./models/userProfile.js')).default;
    
    // Calculate time in the past
    const pastTime = new Date();
    pastTime.setMinutes(pastTime.getMinutes() - minutes);
    
    // Update all users' last interaction time
    const result = await UserProfile.updateMany(
      {}, // Update all users
      { lastInteraction: pastTime }
    );
    
    console.log(`Updated ${result.modifiedCount} users' last interaction time to ${minutes} minutes ago`);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error updating last interaction time:', error);
    return 0;
  }
}

async function startTesting() {
  try {
    // Connect to database
    await database.connect();
    console.log('Connected to MongoDB');
    
    // Get services
    const whatsappService = (await import('./services/whatsappService.mongo.js')).default;
    const memoryService = (await import('./services/memoryService.mongo.js')).default;
    const openaiService = (await import('./services/perplexity.mongo.js')).default;
    
    // Set last interaction to 5 minutes ago (older than our threshold)
    await setUserLastInteraction(5);
    
    console.log('Services loaded');
    console.log('Starting check-in test with 10-second interval');
    
    // Run check-in every 10 seconds
    setInterval(async () => {
      try {
        console.log('\n--- Check-in test at', new Date().toLocaleTimeString(), '---');
        
        // Get active users
        const activeUsers = await whatsappService.getActiveUsers();
        console.log(`Found ${activeUsers.length} active users`);
        
        // Process each user
        for (const user of activeUsers) {
          // Get time since last interaction
          const timeSinceLastInteraction = await memoryService.getTimeSinceLastInteraction(user.phoneNumber);
          console.log(`User ${user.phoneNumber.slice(-4)}: Last interaction ${timeSinceLastInteraction} minutes ago`);
          
          // For testing, always send if more than inactivityThreshold
          if (timeSinceLastInteraction > config.memory.inactivityThreshold) {
            console.log(`Sending check-in to ${user.phoneNumber.slice(-4)}`);
            
            try {
              const checkInMessage = await openaiService.generateCheckInMessage(user.phoneNumber);
              console.log(`Generated message: "${checkInMessage}"`);
              
              const result = await whatsappService.sendMessage(checkInMessage, user.phoneNumber);
              console.log(`Check-in sent to ${user.phoneNumber.slice(-4)}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
            } catch (error) {
              console.error(`Error sending check-in to ${user.phoneNumber.slice(-4)}:`, error.message);
            }
          } else {
            console.log(`Skipping check-in for ${user.phoneNumber.slice(-4)}, too recent`);
          }
        }
      } catch (error) {
        console.error('Error in check-in test:', error);
      }
    }, 10000); // Run every 10 seconds
    
    console.log('Test running (press Ctrl+C to stop)');
  } catch (error) {
    console.error('Error starting test:', error);
    process.exit(1);
  }
}

startTesting();