import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getCustomerMessages } from '@/lib/services/messageService';
import { createLogger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const logger = createLogger();
  
  try {
    await requireAuth();
    
    const customerId = params.customerId;
    const messages = await getCustomerMessages(customerId);

    return NextResponse.json({ messages });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.error('Error fetching messages', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

