import { prisma, Message } from '@/lib/db';
import logger from '@/lib/logger';

export async function saveMessage(data: {
  customerId: string;
  direction: 'in' | 'out';
  channel: 'whatsapp' | 'dashboard';
  text: string;
  meta?: Record<string, any>;
}): Promise<Message> {
  try {
    const newMessage = await prisma.message.create({
      data: {
        customerId: data.customerId,
        direction: data.direction,
        channel: data.channel,
        text: data.text,
        meta: data.meta || null,
      },
    });

    logger.debug('Message saved', {
      messageId: newMessage.id,
      customerId: data.customerId,
      direction: data.direction,
    });

    return newMessage;
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
    const messages = await prisma.message.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages;
  } catch (error) {
    logger.error('Error getting customer messages', { error, customerId });
    return [];
  }
}

export async function getRecentMessages(limit: number = 50): Promise<Message[]> {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages;
  } catch (error) {
    logger.error('Error getting recent messages', { error });
    return [];
  }
}
