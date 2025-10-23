/**
 * WhatsApp Service - Multi-user version
 * Handles sending and receiving messages via WhatsApp Cloud API
 * Supports multiple users with MongoDB backend
 */

import 'dotenv/config';
import axios from 'axios';
import memoryService from './memoryService.mongo.js'; // Use MongoDB version
import openaiService from './perplexity.js';

// WhatsApp API Constants
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

class WhatsAppService {
  /**
   * Send a message to a user via WhatsApp
   * @param {string} messageText - Message to send
   * @param {string} phoneNumber - Recipient's phone number
   */
  async sendMessage(messageText, phoneNumber) {
    try {
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
      
      const response = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        data: {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText
          }
        }
      });

      // Log message to memory for this specific user
      await memoryService.addConversation({
        text: messageText,
        from: 'assistant',
        timestamp: new Date().toISOString()
      }, phoneNumber);
      
      console.log(`Message sent successfully to ${phoneNumber}`);
      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        response: response.data
      };
    } catch (error) {
      console.error(`Error sending WhatsApp message to ${phoneNumber}:`, error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process an incoming message from WhatsApp webhook
   * @param {object} message - WhatsApp message object
   */
  async processIncomingMessage(message) {
    try {
      // Extract the message text and metadata
      const messageText = message.text?.body;
      const from = message.from;
      const timestamp = message.timestamp;
      
      if (!messageText) {
        console.log(`Received non-text message from ${from}`);
        return {
          success: true,
          ignored: true,
          reason: 'Not a text message'
        };
      }
      
      console.log(`📩 Received message from ${from}: ${messageText}`);
      
      // Process any user's message - multi-user support
      console.log(`✅ Processing message from ${from}...`);

      // Detect mood - pass the user's phone number
      const detectedMood = await openaiService.detectMood(messageText, from);
      
      // Store message in memory - user specific
      await memoryService.addConversation({
        text: messageText,
        from: 'user',
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        detectedMood
      }, from);
      
      // Update user mood in profile - user specific
      await memoryService.updateUserProfile({ mood: detectedMood }, from);
      
      // Generate AI response - user specific context
      const aiResponse = await openaiService.generateResponse(messageText, from);
      
      // Send response back to the user
      await this.sendMessage(aiResponse, from);
      
      return {
        success: true,
        processed: true,
        from,
        mood: detectedMood
      };
    } catch (error) {
      console.error('Error processing incoming message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send scheduled check-in messages to all active users
   */
  async sendCheckInMessages() {
    try {
      // Get all users who need check-ins
      // This would require a new method in memoryService to get all users
      const activeUsers = await this.getActiveUsers();
      
      console.log(`Found ${activeUsers.length} active users who might need check-ins`);
      let sentCount = 0;
      
      // Process each user
      for (const user of activeUsers) {
        try {
          // Get time since last interaction for this specific user
          const timeSinceLastInteraction = await memoryService.getTimeSinceLastInteraction(user.phoneNumber);
          
          // Only send if it's been more than 3 hours (180 minutes) since last interaction
          if (timeSinceLastInteraction === null || timeSinceLastInteraction > 180) {
            // Generate personalized check-in message for this user
            const checkInMessage = await openaiService.generateCheckInMessage(user.phoneNumber);
            
            // Send message to this specific user
            await this.sendMessage(checkInMessage, user.phoneNumber);
            
            console.log(`Check-in message sent to ${user.phoneNumber}`);
            sentCount++;
          } else {
            console.log(`Skipping check-in for ${user.phoneNumber}, last interaction was ${timeSinceLastInteraction} minutes ago`);
          }
        } catch (error) {
          console.error(`Error sending check-in to ${user.phoneNumber}:`, error);
          // Continue with other users
        }
      }
      
      return {
        success: true,
        totalUsers: activeUsers.length,
        messagesSent: sentCount
      };
    } catch (error) {
      console.error('Error sending check-in messages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get active users who should receive check-ins
   * This is a placeholder - you would implement this using your MongoDB models
   */
  async getActiveUsers() {
    // Using the UserProfile model to find users
    try {
      // Import here to avoid circular dependencies
      const UserProfile = (await import('../models/userProfile.js')).default;
      
      // Find users who have interacted at least once
      // You might want to add more filters like "users who opted in for check-ins"
      const activeUsers = await UserProfile.find({
        lastInteraction: { $ne: null }
      });
      
      return activeUsers;
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }
  
  /**
   * Verify WhatsApp webhook
   * @param {string} mode - Mode from webhook verification request
   * @param {string} token - Token from webhook verification request
   */
  verifyWebhook(mode, token) {
    // Get verify token from environment or config
    const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'jazzai-webhook-verification';
    
    // Check if mode and token are in the query string
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        // Respond with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        return true;
      }
    }
    return false;
  }
}

const whatsappService = new WhatsAppService();
export default whatsappService;