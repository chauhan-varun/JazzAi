import { getDb, Message, InsertMessage } from '@/lib/db';
import { messages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { ObjectId } from 'mongodb';
import logger from '@/lib/logger';

export async function saveMessage(data: {
  customerId: string;
  direction: 'in' | 'out';
  channel: 'whatsapp' | 'dashboard';
  text: string;
  meta?: Record<string, any>;
}): Promise<Message> {
  try {
    const db = await getDb();
    
    const newMessage: InsertMessage = {
      _id: new ObjectId().toString(),
      customerId: data.customerId,
      direction: data.direction,
      channel: data.channel,
      text: data.text,
      meta: data.meta ? JSON.stringify(data.meta) : null,
      createdAt: new Date(),
    };

    await db.insert(messages).values(newMessage);
    
    logger.debug('Message saved', { 
      messageId: newMessage._id, 
      customerId: data.customerId,
      direction: data.direction,
    });

    return newMessage as Message;
    
  } catch (error) {
    logger.error('Error saving message', { error, customerId: data.customerId });
    throw error;
  }
}

export async function getCustomerMessages(
  customerId: string,
  limit: number = 100
): Promise<Message[]> {
  try {
    const db = await getDb();
    
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.customerId, customerId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    return result ? result.reverse() : []; // Reverse to get chronological order
    
  } catch (error) {
    logger.error('Error getting customer messages', { error, customerId });
    return [];
  }
}

export async function getRecentMessages(limit: number = 50): Promise<Message[]> {
  try {
    const db = await getDb();
    
    const result = await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    return result || [];
    
  } catch (error) {
    logger.error('Error getting recent messages', { error });
    return [];
  }
}

