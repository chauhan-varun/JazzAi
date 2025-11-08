import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getDb, Faq, InsertFaq } from '@/lib/db';
import { faqs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ObjectId } from 'mongodb';
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
    
    const db = await getDb();
    const allFaqs = await db.select().from(faqs);

    return NextResponse.json({ faqs: allFaqs });
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
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const newFaq: InsertFaq = {
      _id: new ObjectId().toString(),
      question: result.data.question,
      answer: result.data.answer,
      category: result.data.category || null,
      keywords: JSON.stringify(result.data.keywords),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(faqs).values(newFaq);

    logger.info('FAQ created', { faqId: newFaq._id });

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
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    await db
      .update(faqs)
      .set({
        question: result.data.question,
        answer: result.data.answer,
        category: result.data.category || null,
        keywords: JSON.stringify(result.data.keywords),
        updatedAt: new Date(),
      })
      .where(eq(faqs._id, result.data.id));

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

    const db = await getDb();
    await db.delete(faqs).where(eq(faqs._id, id));

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

