import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { createLogger } from '@/lib/logger';
import { getOrCreateCustomer } from '@/lib/services/customerService';
import { saveMessage } from '@/lib/services/messageService';
import { searchFaq } from '@/lib/faq/searchFaq';
import { rewriteWithTone, fallbackNoContext } from '@/lib/model/rewriteWithTone';
import { sendWhatsAppMessage, markMessageAsRead } from '@/lib/whatsapp/sendMessage';
import { emitToCustomerRoom } from '@/lib/socket/emitter';

// GET: Webhook verification
export async function GET(request: NextRequest) {
  const logger = createLogger();
  const config = getConfig();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    logger.info('Webhook verification request', { mode, token });

    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      logger.info('Webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    }

    logger.warn('Webhook verification failed', { mode, token });
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    
  } catch (error) {
    logger.error('Error in webhook verification', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST: Receive WhatsApp messages
export async function POST(request: NextRequest) {
  const logger = createLogger();
  
  try {
    const body = await request.json();
    logger.info('Webhook received', { body: JSON.stringify(body) });

    // Parse WhatsApp webhook payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    
    if (!value) {
      return NextResponse.json({ status: 'no_value' }, { status: 200 });
    }

    // Handle messages
    const messages = value.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'no_messages' }, { status: 200 });
    }

    const message = messages[0];
    const waId = message.from;
    const messageText = message.text?.body;
    const whatsappMessageId = message.id;
    const contactName = value.contacts?.[0]?.profile?.name;

    if (!messageText) {
      logger.info('Non-text message received, skipping');
      return NextResponse.json({ status: 'non_text' }, { status: 200 });
    }

    logger.info('Processing message', { waId, messageText, contactName });

    // Mark message as read
    await markMessageAsRead(whatsappMessageId);

    // Get or create customer
    const customer = await getOrCreateCustomer(waId, contactName);

    // Save incoming message
    await saveMessage({
      customerId: customer._id,
      direction: 'in',
      channel: 'whatsapp',
      text: messageText,
      meta: { whatsappMessageId },
    });

    // Emit to dashboard
    emitToCustomerRoom(customer.waId, {
      type: 'message',
      data: {
        direction: 'in',
        text: messageText,
        timestamp: new Date().toISOString(),
      },
    });

    // Check if handoff is active
    if (customer.handoffActive) {
      logger.info('Handoff active, routing to agent', { customerId: customer._id });
      
      // Emit to agent
      if (customer.handoffAssignedTo) {
        emitToCustomerRoom(`agent:${customer.handoffAssignedTo}`, {
          type: 'customer_message',
          data: {
            customerId: customer._id,
            waId: customer.waId,
            name: customer.name,
            text: messageText,
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      return NextResponse.json({ status: 'routed_to_agent' }, { status: 200 });
    }

    // Bot flow: Search FAQ
    const faqResult = await searchFaq(messageText);

    if (!faqResult) {
      // No FAQ found, offer handoff
      const reply = fallbackNoContext();
      
      await sendWhatsAppMessage({
        to: waId,
        message: reply,
        replyToMessageId: whatsappMessageId,
      });

      await saveMessage({
        customerId: customer._id,
        direction: 'out',
        channel: 'whatsapp',
        text: reply,
        meta: { faqNotFound: true },
      });

      emitToCustomerRoom(customer.waId, {
        type: 'message',
        data: {
          direction: 'out',
          text: reply,
          timestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({ status: 'no_faq_found' }, { status: 200 });
    }

    // Rewrite with tone using Perplexity
    const rewriteResult = await rewriteWithTone({
      userQuery: messageText,
      faqAnswer: faqResult.faq.answer || '',
      customerContext: {
        name: customer.name || undefined,
      },
    });

    const reply = rewriteResult.message;

    // Send reply via WhatsApp
    await sendWhatsAppMessage({
      to: waId,
      message: reply,
      replyToMessageId: whatsappMessageId,
    });

    // Save outgoing message
    await saveMessage({
      customerId: customer._id,
      direction: 'out',
      channel: 'whatsapp',
      text: reply,
      meta: {
        faqId: faqResult.faq._id,
        confidence: rewriteResult.confidence,
        score: faqResult.score,
      },
    });

    // Emit to dashboard
    emitToCustomerRoom(customer.waId, {
      type: 'message',
      data: {
        direction: 'out',
        text: reply,
        timestamp: new Date().toISOString(),
        confidence: rewriteResult.confidence,
      },
    });

    logger.info('Message processed successfully', { 
      customerId: customer._id,
      faqId: faqResult.faq._id,
      confidence: rewriteResult.confidence,
    });

    return NextResponse.json({ status: 'success' }, { status: 200 });
    
  } catch (error: any) {
    logger.error('Error processing webhook', { error: error.message, stack: error.stack });
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

