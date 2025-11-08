import { NextRequest, NextResponse } from 'next/server';
import { getSession, destroySession } from '@/lib/auth/session';
import { logoutUser } from '@/lib/services/authService';
import { createLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const logger = createLogger();
  
  try {
    const session = await getSession();

    if (session.isLoggedIn && session.userId) {
      await logoutUser(session.userId);
    }

    await destroySession();

    logger.info('User logged out successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Logout error', { error: error.message });
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}

