import { prisma, User } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'agent';
}): Promise<User | null> {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      logger.warn('User already exists', { email: data.email });
      return null;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        status: 'offline',
      },
    });

    logger.info('User registered', { email: data.email, userId: newUser.id });

    return newUser;
  } catch (error) {
    logger.error('Error registering user', { error, email: data.email });
    return null;
  }
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn('User not found', { email });
      return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      logger.warn('Invalid password', { email });
      return null;
    }

    // Update status to online
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { status: 'online' },
    });

    logger.info('User logged in', { email, userId: user.id });

    return updatedUser;
  } catch (error) {
    logger.error('Error logging in user', { error, email });
    return null;
  }
}

export async function logoutUser(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'offline' },
    });

    logger.info('User logged out', { userId });
    return true;
  } catch (error) {
    logger.error('Error logging out user', { error, userId });
    return false;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  } catch (error) {
    logger.error('Error getting user by ID', { error, userId });
    return null;
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    logger.error('Error getting all users', { error });
    return [];
  }
}
