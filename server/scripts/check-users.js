/**
 * Script to check active users in the MongoDB database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jazzai';

async function checkActiveUsers() {
  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Import the UserProfile model
    const UserProfile = (await import('../models/userProfile.js')).default;
    
    // Find all users
    const users = await UserProfile.find();
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- Phone: ${user.phoneNumber.slice(-4)} (last 4 digits)`);
      console.log(`  Last interaction: ${user.lastInteraction}`);
      console.log(`  Conversation count: ${user.conversationCount}`);
      console.log(`  Mood: ${user.mood}`);
      console.log(`  Favorite topics: ${user.favoriteTopics.join(', ') || 'None'}`);
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
checkActiveUsers();