import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getAllFaqs, createFaq, updateFaq, deleteFaq } from '@/lib/services/faqService';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().optional(),
  keywords: z.array(z.string()),
});

// GET all FAQs
export async function GET(request: NextRequest) {
  const logger = createLogger();

  try {
    await requireAuth();

    const faqs = await getAllFaqs();

    return NextResponse.json({ faqs });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Error fetching FAQs', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST create new FAQ
export async function POST(request: NextRequest) {
  const logger = createLogger();

  try {
    await requireAuth();
    const body = await request.json();

    const result = faqSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const newFaq = await createFaq(result.data);

    if (!newFaq) {
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
    }

    logger.info('FAQ created', { faqId: newFaq.id });

    return NextResponse.json({ faq: newFaq }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Error creating FAQ', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PUT update FAQ
export async function PUT(request: NextRequest) {
  const logger = createLogger();

  try {
    await requireAuth();
    const body = await request.json();

    const updateSchema = faqSchema.extend({ id: z.string() });
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const success = await updateFaq(result.data.id, {
      question: result.data.question,
      answer: result.data.answer,
      category: result.data.category,
      keywords: result.data.keywords,
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
    }

    logger.info('FAQ updated', { faqId: result.data.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Error updating FAQ', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE FAQ
export async function DELETE(request: NextRequest) {
  const logger = createLogger();

  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'FAQ ID required' }, { status: 400 });
    }

    const success = await deleteFaq(id);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
    }

    logger.info('FAQ deleted', { faqId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Error deleting FAQ', { error });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
