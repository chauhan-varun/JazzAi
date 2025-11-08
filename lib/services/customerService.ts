import { getDb, Customer, InsertCustomer } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ObjectId } from 'mongodb';
import logger from '@/lib/logger';

export async function getOrCreateCustomer(waId: string, name?: string): Promise<Customer> {
  try {
    const db = await getDb();
    
    // Try to find existing customer
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.waId, waId))
      .limit(1);

    if (existing && existing.length > 0) {
      // Update last seen
      const updated = {
        ...existing[0],
        lastSeenAt: new Date(),
        ...(name && !existing[0].name && { name }),
      };
      
      await db
        .update(customers)
        .set({ lastSeenAt: new Date(), updatedAt: new Date() })
        .where(eq(customers._id, existing[0]._id));
      
      return updated;
    }

    // Create new customer
    const newCustomer: InsertCustomer = {
      _id: new ObjectId().toString(),
      waId,
      name: name || null,
      lastSeenAt: new Date(),
      tags: JSON.stringify([]),
      handoffAssignedTo: null,
      handoffActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(customers).values(newCustomer);
    
    logger.info('New customer created', { waId, customerId: newCustomer._id });

    return newCustomer as Customer;
    
  } catch (error) {
    logger.error('Error in getOrCreateCustomer', { error, waId });
    throw error;
  }
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const db = await getDb();
    const result = await db
      .select()
      .from(customers)
      .where(eq(customers._id, customerId))
      .limit(1);
    
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error('Error getting customer by ID', { error, customerId });
    return null;
  }
}

export async function updateCustomerHandoff(
  customerId: string,
  handoffActive: boolean,
  assignedTo?: string
): Promise<boolean> {
  try {
    const db = await getDb();
    
    await db
      .update(customers)
      .set({
        handoffActive,
        handoffAssignedTo: assignedTo || null,
        updatedAt: new Date(),
      })
      .where(eq(customers._id, customerId));
    
    logger.info('Customer handoff updated', { customerId, handoffActive, assignedTo });
    
    return true;
  } catch (error) {
    logger.error('Error updating customer handoff', { error, customerId });
    return false;
  }
}

export async function getAllCustomers(limit: number = 100): Promise<Customer[]> {
  try {
    const db = await getDb();
    const result = await db.select().from(customers).limit(limit);
    return result || [];
  } catch (error) {
    logger.error('Error getting all customers', { error });
    return [];
  }
}

