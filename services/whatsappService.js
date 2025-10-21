/**
 * WhatsApp Service
 * Handles sending and receiving messages via WhatsApp Cloud API
 */

require('dotenv').config();
const axios = require('axios');
const memoryService = require('./memoryService');
const openaiService = require('./openaiService');

// WhatsApp API Constants
const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const USER_NUMBER = process.env.USER_NUMBER;

class WhatsAppService {
  /**
   * Send a message to the user via WhatsApp
   */
  async sendMessage(messageText, phoneNumber = USER_NUMBER) {
    try {
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

      // Log message to memory
      await memoryService.addConversation({
        text: messageText,
        from: 'assistant',
        timestamp: new Date().toISOString()
      });
      
      console.log('Message sent successfully');
      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        response: response.data
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process an incoming message from WhatsApp webhook
   */
  async processIncomingMessage(message) {
    try {
      // Extract the message text and metadata
      const messageText = message.text?.body;
      const from = message.from;
      const timestamp = message.timestamp;
      
      console.log(`Received message from ${from}: ${messageText}`);
      
      // Skip if not from our target user (optional - remove this check to allow multiple users)
      if (from !== USER_NUMBER) {
        console.log(`Message from non-target user ${from} ignored.`);
        return {
          success: true,
          ignored: true,
          reason: 'Message not from target user'
        };
      }

      // Detect mood
      const detectedMood = await openaiService.detectMood(messageText);
      
      // Store message in memory
      await memoryService.addConversation({
        text: messageText,
        from: 'user',
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
        detectedMood
      });
      
      // Update user mood in profile
      await memoryService.updateUserProfile({ mood: detectedMood });
      
      // Generate AI response
      const aiResponse = await openaiService.generateResponse(messageText);
      
      // Send response back to the user
      await this.sendMessage(aiResponse, from);
      
      return {
        success: true,
        processed: true,
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
   * Send a scheduled check-in message
   */
  async sendCheckInMessage() {
    try {
      // Get time since last interaction
      const timeSinceLastInteraction = await memoryService.getTimeSinceLastInteraction();
      
      // Only send if it's been more than 3 hours (180 minutes) since last interaction
      if (timeSinceLastInteraction === null || timeSinceLastInteraction > 180) {
        // Generate check-in message
        const checkInMessage = await openaiService.generateCheckInMessage();
        
        // Send message
        await this.sendMessage(checkInMessage);
        
        console.log('Check-in message sent successfully');
        return {
          success: true,
          message: checkInMessage
        };
      } else {
        console.log(`Skipping check-in, last interaction was ${timeSinceLastInteraction} minutes ago`);
        return {
          success: true,
          skipped: true,
          reason: `Last interaction was only ${timeSinceLastInteraction} minutes ago`
        };
      }
    } catch (error) {
      console.error('Error sending check-in message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify WhatsApp webhook
   */
  verifyWebhook(mode, token) {
    const VERIFY_TOKEN = 'jazzai-webhook-verification'; // Hardcoded for simplicity, use env var in production
    
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

module.exports = new WhatsAppService();