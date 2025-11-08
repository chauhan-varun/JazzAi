import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getAllCustomers } from '@/lib/services/customerService';
import { createLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const logger = createLogger();
  
  try {
    await requireAuth();
    
    const customers = await getAllCustomers();

    return NextResponse.json({ customers });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.error('Error fetching customers', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

