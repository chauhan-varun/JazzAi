import { getDb, User, InsertUser } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import logger from '@/lib/logger';

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'agent';
}): Promise<User | null> {
  try {
    const db = await getDb();
    
    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing && existing.length > 0) {
      logger.warn('User already exists', { email: data.email });
      return null;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const newUser: InsertUser = {
      _id: new ObjectId().toString(),
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      status: 'offline',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(users).values(newUser);

    logger.info('User registered', { email: data.email, userId: newUser._id });

    return newUser as User;
  } catch (error) {
    logger.error('Error registering user', { error, email: data.email });
    return null;
  }
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    const db = await getDb();
    
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!result || result.length === 0) {
      logger.warn('User not found', { email });
      return null;
    }

    const user = result[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash || '');

    if (!isValid) {
      logger.warn('Invalid password', { email });
      return null;
    }

    // Update status to online
    await db
      .update(users)
      .set({ status: 'online', updatedAt: new Date() })
      .where(eq(users._id, user._id));

    logger.info('User logged in', { email, userId: user._id });

    return { ...user, status: 'online' };
  } catch (error) {
    logger.error('Error logging in user', { error, email });
    return null;
  }
}

export async function logoutUser(userId: string): Promise<boolean> {
  try {
    const db = await getDb();
    
    await db
      .update(users)
      .set({ status: 'offline', updatedAt: new Date() })
      .where(eq(users._id, userId));

    logger.info('User logged out', { userId });
    return true;
  } catch (error) {
    logger.error('Error logging out user', { error, userId });
    return false;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const db = await getDb();
    
    const result = await db
      .select()
      .from(users)
      .where(eq(users._id, userId))
      .limit(1);

    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error('Error getting user by ID', { error, userId });
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const db = await getDb();
    const result = await db.select().from(users);
    return result || [];
  } catch (error) {
    logger.error('Error getting all users', { error });
    return [];
  }
}

