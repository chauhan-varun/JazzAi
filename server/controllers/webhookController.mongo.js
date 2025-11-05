/**
 * Webhook Controller - Multi-user version
 * Handles incoming webhooks from WhatsApp Cloud API
 */

import whatsappService from '../services/whatsappService.mongo.js';
import { Logger } from '../utils/utils.mongo.js';

class WebhookController {
  constructor() {
    // Bind methods to maintain 'this' context when used as callbacks
    this.verifyWebhook = this.verifyWebhook.bind(this);
    this.handleWebhook = this.handleWebhook.bind(this);
    this._processMessageAsync = this._processMessageAsync.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }
  
  /**
   * Process GET requests (used for webhook verification)
   */
  verifyWebhook(req, res) {
    // Parse the query params
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    Logger.info(`Received webhook verification: mode=${mode}, token=${token}`);
    
    // Verify webhook
    if (whatsappService.verifyWebhook(mode, token)) {
      // Respond with the challenge token from the request
      Logger.info('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      Logger.error('Webhook verification failed');
      res.sendStatus(403);
    }
  }

  /**
   * Process POST requests (incoming messages)
   */
  async handleWebhook(req, res) {
    try {
      // Check if this is a WhatsApp message
      if (req.body.object && req.body.entry) {
        Logger.info('Received webhook event');
        
        // Process each entry
        for (const entry of req.body.entry) {
          // Process changes to the WhatsApp Business Account
          if (entry.changes) {
            for (const change of entry.changes) {
              // Process WhatsApp messages
              if (change.field === 'messages' && change.value && change.value.messages) {
                // Process each message
                for (const message of change.value.messages) {
                  // Process only if it's a text message
                  if (message.type === 'text') {
                    Logger.info(`Processing incoming message from ${message.from.slice(-4)}`);
                    
                    // Process message asynchronously (don't wait for response)
                    this._processMessageAsync(message);
                  } else {
                    Logger.info(`Skipping non-text message of type: ${message.type}`);
                  }
                }
              }
            }
          }
        }
        
        // Always respond with a 200 OK to acknowledge receipt
        res.status(200).send('EVENT_RECEIVED');
      } else {
        // Not a WhatsApp API event
        Logger.info('Received non-WhatsApp event');
        res.status(400).send('BAD_REQUEST');
      }
    } catch (error) {
      Logger.error('Error processing webhook:', error);
      res.status(500).send('ERROR');
    }
  }

  /**
   * Process incoming WhatsApp message asynchronously
   * @param {object} message - WhatsApp message object
   */
  async _processMessageAsync(message) {
    try {
      // Process the message
      const result = await whatsappService.processIncomingMessage(message);
      Logger.info(`Message from ${message.from.slice(-4)} processed successfully`);
    } catch (error) {
      Logger.error(`Error processing message from ${message.from?.slice(-4) || 'unknown'}:`, error);
    }
  }

  /**
   * Handle health check endpoint
   */
  healthCheck(req, res) {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  }
}

const webhookController = new WebhookController();
export default webhookController;