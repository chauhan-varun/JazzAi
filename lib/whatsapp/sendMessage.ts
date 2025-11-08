import axios from 'axios';
import { getConfig } from '@/lib/config';
import logger from '@/lib/logger';

export interface SendWhatsAppMessageParams {
  to: string; // WhatsApp ID (phone number)
  message: string;
  replyToMessageId?: string;
}

export interface WhatsAppMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsAppMessage(
  params: SendWhatsAppMessageParams
): Promise<WhatsAppMessageResponse> {
  const config = getConfig();
  
  try {
    const url = `https://graph.facebook.com/v18.0/${config.whatsapp.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: params.to,
      type: 'text',
      text: {
        preview_url: false,
        body: params.message,
      },
      ...(params.replyToMessageId && {
        context: {
          message_id: params.replyToMessageId,
        },
      }),
    };

    logger.info('Sending WhatsApp message', { to: params.to });

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const messageId = response.data.messages?.[0]?.id;

    logger.info('WhatsApp message sent successfully', { to: params.to, messageId });

    return {
      success: true,
      messageId,
    };
    
  } catch (error: any) {
    logger.error('Error sending WhatsApp message', { 
      error: error.message,
      to: params.to,
      response: error.response?.data,
    });

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
}

export async function markMessageAsRead(messageId: string): Promise<boolean> {
  const config = getConfig();
  
  try {
    const url = `https://graph.facebook.com/v18.0/${config.whatsapp.phoneNumberId}/messages`;
    
    await axios.post(url, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }, {
      headers: {
        'Authorization': `Bearer ${config.whatsapp.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return true;
  } catch (error) {
    logger.error('Error marking message as read', { error, messageId });
    return false;
  }
}

