/**
 * Migration Script: JSON to MongoDB
 * Migrates data from memory.json to MongoDB database
 */

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Import MongoDB models
import database from '../services/databaseService.js';
import UserProfile from '../models/userProfile.js';
import Conversation from '../models/conversation.js';
import Insight from '../models/insight.js';
import Reminder from '../models/reminder.js';

// Get file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORY_FILE_PATH = path.join(__dirname, '../data/memory.json');

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('Starting migration from JSON to MongoDB...');
    
    // Connect to database
    await database.connect();
    console.log('Connected to MongoDB');
    
    // Read the JSON file
    console.log(`Reading memory file: ${MEMORY_FILE_PATH}`);
    const data = await fs.readFile(MEMORY_FILE_PATH, 'utf8');
    const memory = JSON.parse(data);
    
    // Get the user's phone number from environment
    const phoneNumber = process.env.USER_NUMBER;
    if (!phoneNumber) {
      throw new Error('USER_NUMBER environment variable is required');
    }
    
    console.log(`Migrating data for phone number: ${phoneNumber}`);
    
    // Create user profile
    console.log('Migrating user profile...');
    const userId = `user_${Date.now()}`;
    
    const userProfile = new UserProfile({
      userId,
      phoneNumber,
      name: memory.userProfile.name || '',
      mood: memory.userProfile.mood || '',
      favoriteTopics: memory.userProfile.favoriteTopics || [],
      lastInteraction: memory.userProfile.lastInteraction ? new Date(memory.userProfile.lastInteraction) : null,
      conversationCount: memory.userProfile.conversationCount || 0,
      personalDetails: memory.userProfile.personalDetails || {}
    });
    
    await userProfile.save();
    console.log('User profile migrated successfully');
    
    // Create conversations
    console.log(`Migrating ${memory.conversations.length} conversations...`);
    
    for (const convo of memory.conversations) {
      const conversation = new Conversation({
        userId,
        phoneNumber,
        timestamp: new Date(convo.timestamp),
        message: convo.message,
        from: convo.from,
        userMood: convo.userMood || 'unknown'
      });
      
      await conversation.save();
    }
    
    console.log('Conversations migrated successfully');
    
    // Create insights
    console.log('Migrating insights...');
    
    const insight = new Insight({
      userId,
      phoneNumber,
      commonPhrases: memory.insights.commonPhrases || [],
      sentimentTrend: memory.insights.sentimentTrend || 'neutral',
      engagementLevel: memory.insights.engagementLevel || 'medium',
      topics: memory.insights.topics || {}
    });
    
    await insight.save();
    console.log('Insights migrated successfully');
    
    // Create reminders
    if (memory.reminders && memory.reminders.length > 0) {
      console.log(`Migrating ${memory.reminders.length} reminders...`);
      
      for (const rem of memory.reminders) {
        const reminder = new Reminder({
          userId,
          phoneNumber,
          text: rem.text,
          created: new Date(rem.created),
          triggerTime: new Date(rem.triggerTime),
          completed: rem.completed || false
        });
        
        await reminder.save();
      }
      
      console.log('Reminders migrated successfully');
    } else {
      console.log('No reminders to migrate');
    }
    
    console.log('Migration completed successfully!');
    console.log(`
    Summary:
    - User Profile: Migrated
    - Conversations: ${memory.conversations.length} migrated
    - Insights: Migrated
    - Reminders: ${memory.reminders?.length || 0} migrated
    `);
    
    // Disconnect from database
    await database.disconnect();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Run migration
migrate();