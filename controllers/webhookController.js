/**
 * Webhook Controller
 * Handles incoming webhook requests from WhatsApp
 */

import config from '../config/config.js';
import whatsappService from '../services/whatsappService.js';

class WebhookController {
  /**
   * Handle GET requests for webhook verification
   */
  verifyWebhook(req, res) {
    try {
      // Get query parameters
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      // Verify the webhook
      const isVerified = whatsappService.verifyWebhook(mode, token);

      if (isVerified) {
        // Send back the challenge to confirm verification
        console.log('Webhook verified successfully');
        return res.status(200).send(challenge);
      } else {
        // Verification failed
        console.error('Webhook verification failed');
        return res.status(403).json({ error: 'Verification failed' });
      }
    } catch (error) {
      console.error('Error verifying webhook:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle POST requests for incoming messages
   */
  async receiveMessage(req, res) {
    try {
      // Send an immediate 200 OK response to acknowledge receipt
      res.status(200).send('EVENT_RECEIVED');

      const body = req.body;
      
      console.log('=== WEBHOOK RECEIVED ===');
      console.log('Full webhook body:', JSON.stringify(body, null, 2));
      console.log('========================');

      // Check if this is a WhatsApp message event
      if (body.object && 
          body.entry && 
          body.entry[0].changes && 
          body.entry[0].changes[0].value.messages) {
        
        const message = body.entry[0].changes[0].value.messages[0];
        console.log('✓ Valid WhatsApp message detected');
        console.log('From:', message.from);
        console.log('Type:', message.type);
        console.log('Message:', JSON.stringify(message, null, 2));
        
        // Process the message asynchronously
        await this.processMessage(message);
      } else {
        console.log('⚠️  Received webhook event but not a message');
        console.log('Body structure:', JSON.stringify(body, null, 2));
      }
    } catch (error) {
      console.error('❌ Error processing webhook message:', error);
      // We've already sent a 200 OK response, so no need to send another response
    }
  }

  /**
   * Process incoming WhatsApp message
   */
  async processMessage(message) {
    try {
      // Only process text messages
      if (message.type === 'text') {
        await whatsappService.processIncomingMessage(message);
      } else {
        console.log(`Received non-text message of type: ${message.type}`);
        // Optionally handle other message types (image, audio, etc.)
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }
}

const webhookController = new WebhookController();
export default webhookController;