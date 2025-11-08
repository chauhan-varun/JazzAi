import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { saveMessage } from '@/lib/services/messageService';
import { sendWhatsAppMessage } from '@/lib/whatsapp/sendMessage';
import { emitToCustomerRoom } from '@/lib/socket/emitter';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

const messageSchema = z.object({
  customerId: z.string(),
  waId: z.string(),
  text: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const logger = createLogger();
  
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const result = messageSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { customerId, waId, text } = result.data;

    // Send via WhatsApp
    const whatsappResult = await sendWhatsAppMessage({
      to: waId,
      message: text,
    });

    if (!whatsappResult.success) {
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message' },
        { status: 500 }
      );
    }

    // Save message
    await saveMessage({
      customerId,
      direction: 'out',
      channel: 'dashboard',
      text,
      meta: {
        agentId: session.userId,
        whatsappMessageId: whatsappResult.messageId,
      },
    });

    // Emit to customer room
    emitToCustomerRoom(waId, {
      type: 'message',
      data: {
        direction: 'out',
        text,
        timestamp: new Date().toISOString(),
        fromAgent: true,
      },
    });

    logger.info('Agent message sent', { customerId, agentId: session.userId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.error('Error sending agent message', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

