/**
 * Memory Service
 * Handles all operations related to the AI's memory (user data, conversation history, etc.)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEMORY_FILE_PATH = path.join(__dirname, '../data/memory.json');

class MemoryService {
  constructor() {
    this.memoryCache = null;
    this.initializeMemory();
  }

  /**
   * Initialize memory by loading from file or creating new if doesn't exist
   */
  async initializeMemory() {
    try {
      await this.loadMemory();
      console.log('Memory loaded successfully');
    } catch (error) {
      console.log('Creating new memory file...');
      
      const initialMemory = {
        userProfile: {
          name: '',
          mood: '',
          favoriteTopics: [],
          lastInteraction: null,
          conversationCount: 0,
          personalDetails: {}
        },
        conversations: [],
        insights: {
          commonPhrases: [],
          sentimentTrend: 'neutral',
          engagementLevel: 'medium',
          topics: {}
        },
        reminders: []
      };
      
      await this.saveMemory(initialMemory);
      this.memoryCache = initialMemory;
    }
  }

  /**
   * Load memory from the JSON file
   */
  async loadMemory() {
    try {
      const data = await fs.readFile(MEMORY_FILE_PATH, 'utf8');
      this.memoryCache = JSON.parse(data);
      return this.memoryCache;
    } catch (error) {
      console.error('Error loading memory:', error.message);
      throw error;
    }
  }

  /**
   * Save memory to the JSON file
   */
  async saveMemory(memoryData = null) {
    try {
      const dataToSave = memoryData || this.memoryCache;
      await fs.writeFile(
        MEMORY_FILE_PATH,
        JSON.stringify(dataToSave, null, 2),
        'utf8'
      );
      return true;
    } catch (error) {
      console.error('Error saving memory:', error.message);
      return false;
    }
  }

  /**
   * Get the complete memory
   */
  async getFullMemory() {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    return this.memoryCache;
  }

  /**
   * Get user profile from memory
   */
  async getUserProfile() {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    return this.memoryCache.userProfile;
  }

  /**
   * Update user profile with new information
   */
  async updateUserProfile(profileData) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    this.memoryCache.userProfile = {
      ...this.memoryCache.userProfile,
      ...profileData
    };
    
    await this.saveMemory();
    return this.memoryCache.userProfile;
  }

  /**
   * Add a new conversation to memory
   */
  async addConversation(messageObj) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    const conversation = {
      timestamp: new Date().toISOString(),
      message: messageObj.text,
      from: messageObj.from,
      userMood: messageObj.detectedMood || 'unknown'
    };
    
    // Update lastInteraction time
    this.memoryCache.userProfile.lastInteraction = conversation.timestamp;
    
    // Increment conversation count
    this.memoryCache.userProfile.conversationCount += 1;
    
    // Add to conversations array (limit to last 50 conversations to avoid file size issues)
    this.memoryCache.conversations.push(conversation);
    if (this.memoryCache.conversations.length > 50) {
      this.memoryCache.conversations.shift();
    }
    
    await this.saveMemory();
    return conversation;
  }

  /**
   * Get recent conversations (last n conversations)
   */
  async getRecentConversations(limit = 10) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    const conversations = [...this.memoryCache.conversations];
    return conversations.reverse().slice(0, limit);
  }

  /**
   * Extract insights from conversations
   * This is a simplified version - in production, you might use NLP here
   */
  async updateInsights(messageText) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    // Simple topic tracking (very basic implementation)
    const topics = {
      'work': ['job', 'work', 'boss', 'project', 'deadline', 'meeting'],
      'health': ['exercise', 'workout', 'gym', 'health', 'diet', 'sleep'],
      'entertainment': ['movie', 'show', 'music', 'game', 'play', 'watch'],
      'education': ['learn', 'study', 'class', 'course', 'book', 'read']
    };
    
    const lowerMessage = messageText.toLowerCase();
    
    // Check which topics are mentioned
    Object.keys(topics).forEach(topic => {
      const keywords = topics[topic];
      const mentioned = keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
      
      if (mentioned) {
        // Initialize topic count if it doesn't exist
        if (!this.memoryCache.insights.topics[topic]) {
          this.memoryCache.insights.topics[topic] = 0;
        }
        
        // Increment topic count
        this.memoryCache.insights.topics[topic]++;
      }
    });
    
    // Save memory with updated insights
    await this.saveMemory();
    return this.memoryCache.insights;
  }

  /**
   * Get user's favorite topics based on frequency
   */
  async getFavoriteTopics(limit = 3) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    const topics = this.memoryCache.insights.topics;
    
    // Sort topics by count
    const sortedTopics = Object.keys(topics)
      .map(topic => ({ name: topic, count: topics[topic] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(topic => topic.name);
    
    // Update favorite topics in user profile
    this.memoryCache.userProfile.favoriteTopics = sortedTopics;
    await this.saveMemory();
    
    return sortedTopics;
  }

  /**
   * Add or update a reminder
   */
  async addReminder(reminder) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    const newReminder = {
      id: Date.now().toString(),
      text: reminder.text,
      created: new Date().toISOString(),
      triggerTime: reminder.triggerTime || new Date().toISOString(),
      completed: false
    };
    
    this.memoryCache.reminders.push(newReminder);
    await this.saveMemory();
    return newReminder;
  }

  /**
   * Get all pending reminders
   */
  async getPendingReminders() {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    return this.memoryCache.reminders.filter(reminder => !reminder.completed);
  }

  /**
   * Mark a reminder as completed
   */
  async completeReminder(reminderId) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    const reminderIndex = this.memoryCache.reminders.findIndex(r => r.id === reminderId);
    
    if (reminderIndex !== -1) {
      this.memoryCache.reminders[reminderIndex].completed = true;
      await this.saveMemory();
      return true;
    }
    
    return false;
  }

  /**
   * Get time since last interaction in minutes
   */
  async getTimeSinceLastInteraction() {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    const lastInteraction = this.memoryCache.userProfile.lastInteraction;
    
    if (!lastInteraction) {
      return null; // No previous interaction
    }
    
    const lastInteractionTime = new Date(lastInteraction).getTime();
    const currentTime = new Date().getTime();
    
    // Calculate difference in minutes
    return Math.floor((currentTime - lastInteractionTime) / (1000 * 60));
  }
}

const memoryService = new MemoryService();
export default memoryService;