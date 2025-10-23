/**
 * Script to update a user's last interaction time for testing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jazzai';

async function updateLastInteraction() {
  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Import the UserProfile model
    const UserProfile = (await import('../models/userProfile.js')).default;
    
    // Calculate a time 10 minutes ago
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    // Find all users and update them
    const result = await UserProfile.updateMany(
      {}, // Update all users
      { lastInteraction: tenMinutesAgo }
    );
    
    console.log(`Updated ${result.modifiedCount} users' last interaction time to 10 minutes ago`);
    
    // Check if it worked
    const users = await UserProfile.find();
    users.forEach(user => {
      console.log(`- Phone: ${user.phoneNumber.slice(-4)} (last 4 digits)`);
      console.log(`  Last interaction: ${user.lastInteraction}`);
      const minutesAgo = Math.floor((new Date() - new Date(user.lastInteraction)) / (1000 * 60));
      console.log(`  Minutes ago: ${minutesAgo}`);
      console.log('---');
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
updateLastInteraction();