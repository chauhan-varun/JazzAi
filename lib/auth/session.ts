import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { getConfig } from '@/lib/config';

export interface SessionData {
  userId: string;
  email: string;
  role: 'admin' | 'agent';
  isLoggedIn: boolean;
}

const defaultSession: SessionData = {
  userId: '',
  email: '',
  role: 'agent',
  isLoggedIn: false,
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const config = getConfig();
  const cookieStore = await cookies();
  
  return getIronSession<SessionData>(cookieStore, {
    password: config.auth.nextAuthSecret,
    cookieName: 'luna-ai-session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    },
  });
}

export async function createSession(data: Omit<SessionData, 'isLoggedIn'>): Promise<void> {
  const session = await getSession();
  session.userId = data.userId;
  session.email = data.email;
  session.role = data.role;
  session.isLoggedIn = true;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  
  if (!session.isLoggedIn) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

