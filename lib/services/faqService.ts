import { prisma, Faq } from '@/lib/db';
import logger from '@/lib/logger';

export async function getAllFaqs(): Promise<Faq[]> {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return faqs;
  } catch (error) {
    logger.error('Error getting all FAQs', { error });
    return [];
  }
}

export async function createFaq(data: {
  question: string;
  answer: string;
  category?: string;
  keywords: string[];
}): Promise<Faq | null> {
  try {
    const newFaq = await prisma.faq.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category || null,
        keywords: data.keywords,
      },
    });

    logger.info('FAQ created', { faqId: newFaq.id });
    return newFaq;
  } catch (error) {
    logger.error('Error creating FAQ', { error });
    return null;
  }
}

export async function updateFaq(
  id: string,
  data: {
    question: string;
    answer: string;
    category?: string;
    keywords: string[];
  }
): Promise<boolean> {
  try {
    await prisma.faq.update({
      where: { id },
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category || null,
        keywords: data.keywords,
      },
    });

    logger.info('FAQ updated', { faqId: id });
    return true;
  } catch (error) {
    logger.error('Error updating FAQ', { error, faqId: id });
    return false;
  }
}

export async function deleteFaq(id: string): Promise<boolean> {
  try {
    await prisma.faq.delete({
      where: { id },
    });

    logger.info('FAQ deleted', { faqId: id });
    return true;
  } catch (error) {
    logger.error('Error deleting FAQ', { error, faqId: id });
    return false;
  }
}

