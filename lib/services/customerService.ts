import { prisma, Customer } from '@/lib/db';
import logger from '@/lib/logger';

export async function getOrCreateCustomer(waId: string, name?: string): Promise<Customer> {
  try {
    // Try to find existing customer
    let customer = await prisma.customer.findUnique({
      where: { waId },
    });

    if (customer) {
      // Update last seen
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          lastSeenAt: new Date(),
          ...(name && !customer.name && { name }),
        },
      });

      return customer;
    }

    // Create new customer
    const newCustomer = await prisma.customer.create({
      data: {
        waId,
        name: name || null,
        lastSeenAt: new Date(),
        tags: [],
        handoffActive: false,
      },
    });

    logger.info('New customer created', { waId, customerId: newCustomer.id });

    return newCustomer;
  } catch (error) {
    logger.error('Error in getOrCreateCustomer', { error, waId });
    throw error;
  }
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    return customer;
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
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        handoffActive,
        handoffAssignedTo: assignedTo || null,
      },
    });

    logger.info('Customer handoff updated', { customerId, handoffActive, assignedTo });

    return true;
  } catch (error) {
    logger.error('Error updating customer handoff', { error, customerId });
    return false;
  }
}

export async function getAllCustomers(limit: number = 100): Promise<Customer[]> {
  try {
    const customers = await prisma.customer.findMany({
      take: limit,
      orderBy: { lastSeenAt: 'desc' },
    });

    return customers;
  } catch (error) {
    logger.error('Error getting all customers', { error });
    return [];
  }
}
