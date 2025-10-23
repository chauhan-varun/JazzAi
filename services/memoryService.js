/**
 * Memory Service - MongoDB Version
 * Handles all operations related to the AI's memory (user data, conversation history, etc.)
 * using MongoDB instead of file-based storage.
 */

import 'dotenv/config';
import database from './databaseService.js';
import UserProfile from '../models/userProfile.js';
import Conversation from '../models/conversation.js';
import Insight from '../models/insight.js';
import Reminder from '../models/reminder.js';

// Default user phone number (from environment variables)
const DEFAULT_USER = process.env.USER_NUMBER;

class MemoryService {
  constructor() {
    // Ensure database connection
    this.ensureConnected();
  }

  /**
   * Ensure database connection is established
   */
  async ensureConnected() {
    await database.connect();
  }

  /**
   * Get user profile or create if doesn't exist
   * @param {string} phoneNumber - User's phone number (default from env)
   */
  async getUserProfile(phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Try to find existing user
      let userProfile = await UserProfile.findOne({ phoneNumber });
      
      // If user doesn't exist, create new profile
      if (!userProfile) {
        console.log(`Creating new user profile for ${phoneNumber}`);
        
        userProfile = new UserProfile({
          userId: `user_${Date.now()}`,
          phoneNumber,
          name: '',
          mood: '',
          favoriteTopics: [],
          lastInteraction: null,
          conversationCount: 0,
          personalDetails: {}
        });
        
        await userProfile.save();
        
        // Also create default insights for the user
        const insight = new Insight({
          userId: userProfile.userId,
          phoneNumber,
          commonPhrases: [],
          sentimentTrend: 'neutral',
          engagementLevel: 'medium',
          topics: {}
        });
        
        await insight.save();
      }
      
      return userProfile.toObject();
    } catch (error) {
      console.error('Error getting user profile:', error.message);
      throw error;
    }
  }

  /**
   * Update user profile with new information
   * @param {object} profileData - User profile data to update
   * @param {string} phoneNumber - User's phone number
   */
  async updateUserProfile(profileData, phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Get current user profile
      const currentProfile = await this.getUserProfile(phoneNumber);
      
      // Update profile
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { phoneNumber },
        { 
          ...profileData,
          updatedAt: new Date()
        },
        { new: true, upsert: true }
      );
      
      return updatedProfile.toObject();
    } catch (error) {
      console.error('Error updating user profile:', error.message);
      throw error;
    }
  }

  /**
   * Add a new conversation to memory
   * @param {object} messageObj - Message object with text, from, and optional mood
   * @param {string} phoneNumber - User's phone number
   */
  async addConversation(messageObj, phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(phoneNumber);
      
      // Create conversation
      const conversation = new Conversation({
        userId: userProfile.userId,
        phoneNumber,
        timestamp: new Date(),
        message: messageObj.text,
        from: messageObj.from,
        userMood: messageObj.detectedMood || 'unknown'
      });
      
      await conversation.save();
      
      // Update last interaction time and conversation count
      await UserProfile.findOneAndUpdate(
        { phoneNumber },
        { 
          lastInteraction: new Date(),
          $inc: { conversationCount: 1 }
        }
      );
      
      return conversation.toObject();
    } catch (error) {
      console.error('Error adding conversation:', error.message);
      throw error;
    }
  }

  /**
   * Get recent conversations for a user
   * @param {number} limit - Number of conversations to return
   * @param {string} phoneNumber - User's phone number
   */
  async getRecentConversations(limit = 10, phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(phoneNumber);
      
      // Get conversations
      const conversations = await Conversation.find({ 
        userId: userProfile.userId 
      })
        .sort({ timestamp: -1 })
        .limit(limit);
      
      return conversations.map(conv => conv.toObject());
    } catch (error) {
      console.error('Error getting recent conversations:', error.message);
      throw error;
    }
  }

  /**
   * Extract insights from conversations
   * @param {string} messageText - Message to analyze
   * @param {string} phoneNumber - User's phone number
   */
  async updateInsights(messageText, phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(phoneNumber);
      
      // Get current insights
      let insights = await Insight.findOne({ 
        userId: userProfile.userId 
      });
      
      if (!insights) {
        insights = new Insight({
          userId: userProfile.userId,
          phoneNumber,
          commonPhrases: [],
          sentimentTrend: 'neutral',
          engagementLevel: 'medium',
          topics: {}
        });
      }
      
      // Simple topic tracking (very basic implementation)
      const topics = {
        'work': ['job', 'work', 'boss', 'project', 'deadline', 'meeting'],
        'health': ['exercise', 'workout', 'gym', 'health', 'diet', 'sleep'],
        'entertainment': ['movie', 'show', 'music', 'game', 'play', 'watch'],
        'education': ['learn', 'study', 'class', 'course', 'book', 'read']
      };
      
      const lowerMessage = messageText.toLowerCase();
      const insightTopics = insights.topics.toObject ? insights.topics.toObject() : insights.topics;
      
      // Check which topics are mentioned
      Object.keys(topics).forEach(topic => {
        const keywords = topics[topic];
        const mentioned = keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
        
        if (mentioned) {
          // Initialize topic if it doesn't exist
          if (!insightTopics[topic]) {
            insightTopics[topic] = 0;
          }
          
          // Increment topic count
          insightTopics[topic]++;
        }
      });
      
      // Update insights
      insights.topics = insightTopics;
      insights.updatedAt = new Date();
      await insights.save();
      
      return insights.toObject();
    } catch (error) {
      console.error('Error updating insights:', error.message);
      throw error;
    }
  }

  /**
   * Get user's favorite topics based on frequency
   * @param {number} limit - Maximum number of topics to return
   * @param {string} phoneNumber - User's phone number
   */
  async getFavoriteTopics(limit = 3, phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(phoneNumber);
      
      // Get insights
      const insights = await Insight.findOne({ userId: userProfile.userId });
      if (!insights || !insights.topics) {
        return [];
      }
      
      const topics = insights.topics.toObject ? insights.topics.toObject() : insights.topics;
      
      // Sort topics by count
      const sortedTopics = Object.keys(topics)
        .map(topic => ({ name: topic, count: topics[topic] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(topic => topic.name);
      
      // Update favorite topics in user profile
      await UserProfile.findOneAndUpdate(
        { userId: userProfile.userId },
        { favoriteTopics: sortedTopics }
      );
      
      return sortedTopics;
    } catch (error) {
      console.error('Error getting favorite topics:', error.message);
      return [];
    }
  }

  /**
   * Add or update a reminder
   * @param {object} reminder - Reminder data
   * @param {string} phoneNumber - User's phone number
   */
  async addReminder(reminder, phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(phoneNumber);
      
      // Create reminder
      const newReminder = new Reminder({
        userId: userProfile.userId,
        phoneNumber,
        text: reminder.text,
        created: new Date(),
        triggerTime: reminder.triggerTime || new Date(),
        completed: false
      });
      
      await newReminder.save();
      return newReminder.toObject();
    } catch (error) {
      console.error('Error adding reminder:', error.message);
      throw error;
    }
  }

  /**
   * Get all pending reminders for a user
   * @param {string} phoneNumber - User's phone number
   */
  async getPendingReminders(phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(phoneNumber);
      
      // Get pending reminders
      const reminders = await Reminder.find({
        userId: userProfile.userId,
        completed: false,
        triggerTime: { $lte: new Date() }
      }).sort({ triggerTime: 1 });
      
      return reminders.map(reminder => reminder.toObject());
    } catch (error) {
      console.error('Error getting pending reminders:', error.message);
      return [];
    }
  }

  /**
   * Mark a reminder as completed
   * @param {string} reminderId - ID of the reminder to complete
   * @param {string} phoneNumber - User's phone number
   */
  async completeReminder(reminderId, phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Update reminder
      const result = await Reminder.findByIdAndUpdate(
        reminderId,
        { completed: true }
      );
      
      return !!result;
    } catch (error) {
      console.error('Error completing reminder:', error.message);
      return false;
    }
  }

  /**
   * Get time since last interaction in minutes
   * @param {string} phoneNumber - User's phone number
   */
  async getTimeSinceLastInteraction(phoneNumber = DEFAULT_USER) {
    await this.ensureConnected();
    
    try {
      // Get user profile
      const userProfile = await this.getUserProfile(phoneNumber);
      
      if (!userProfile.lastInteraction) {
        return null; // No previous interaction
      }
      
      const lastInteractionTime = new Date(userProfile.lastInteraction).getTime();
      const currentTime = new Date().getTime();
      
      // Calculate difference in minutes
      return Math.floor((currentTime - lastInteractionTime) / (1000 * 60));
    } catch (error) {
      console.error('Error getting time since last interaction:', error.message);
      return null;
    }
  }
}

const memoryService = new MemoryService();
export default memoryService;