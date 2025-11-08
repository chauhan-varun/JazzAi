import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { updateCustomerHandoff } from '@/lib/services/customerService';
import { emitToCustomerRoom } from '@/lib/socket/emitter';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

const handoffSchema = z.object({
  customerId: z.string(),
  waId: z.string(),
  handoffActive: z.boolean(),
  assignedTo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const logger = createLogger();
  
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const result = handoffSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { customerId, waId, handoffActive, assignedTo } = result.data;

    // Update customer handoff status
    const success = await updateCustomerHandoff(
      customerId,
      handoffActive,
      assignedTo || session.userId
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update handoff' },
        { status: 500 }
      );
    }

    // Emit socket event
    if (handoffActive) {
      emitToCustomerRoom(waId, {
        type: 'handoff:active',
        data: {
          active: true,
          agentId: assignedTo || session.userId,
        },
      });
    } else {
      emitToCustomerRoom(waId, {
        type: 'handoff:active',
        data: {
          active: false,
        },
      });
    }

    logger.info('Handoff updated', { customerId, handoffActive, agentId: session.userId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.error('Error updating handoff', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

