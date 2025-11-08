import { ObjectId } from 'mongodb';
import { index, mongoCollection, varchar, boolean, date } from 'drizzle-orm/mongo';

// User (Agent) Schema
export const users = mongoCollection('users', {
  _id: varchar('_id').$defaultFn(() => new ObjectId().toString()),
  name: varchar('name'),
  email: varchar('email'),
  role: varchar('role', { enum: ['admin', 'agent'] }),
  status: varchar('status', { enum: ['online', 'offline'] }).$default('offline'),
  passwordHash: varchar('passwordHash'),
  createdAt: date('createdAt').$defaultFn(() => new Date()),
  updatedAt: date('updatedAt').$defaultFn(() => new Date()),
}, (table) => [
  index('email_idx').on(table.email),
]);

// Customer Schema
export const customers = mongoCollection('customers', {
  _id: varchar('_id').$defaultFn(() => new ObjectId().toString()),
  waId: varchar('waId'), // WhatsApp ID (phone number)
  name: varchar('name'),
  lastSeenAt: date('lastSeenAt'),
  tags: varchar('tags'), // JSON stringified array
  handoffAssignedTo: varchar('handoffAssignedTo'), // User ID
  handoffActive: boolean('handoffActive').$default(false),
  createdAt: date('createdAt').$defaultFn(() => new Date()),
  updatedAt: date('updatedAt').$defaultFn(() => new Date()),
}, (table) => [
  index('waId_idx').on(table.waId),
  index('handoffAssignedTo_idx').on(table.handoffAssignedTo),
]);

// Message Schema
export const messages = mongoCollection('messages', {
  _id: varchar('_id').$defaultFn(() => new ObjectId().toString()),
  customerId: varchar('customerId'),
  direction: varchar('direction', { enum: ['in', 'out'] }),
  channel: varchar('channel', { enum: ['whatsapp', 'dashboard'] }),
  text: varchar('text'),
  meta: varchar('meta'), // JSON stringified metadata (whatsapp message IDs, etc.)
  createdAt: date('createdAt').$defaultFn(() => new Date()),
}, (table) => [
  index('customerId_idx').on(table.customerId),
  index('createdAt_idx').on(table.createdAt),
]);

// FAQ Schema
export const faqs = mongoCollection('faqs', {
  _id: varchar('_id').$defaultFn(() => new ObjectId().toString()),
  question: varchar('question'),
  answer: varchar('answer'),
  category: varchar('category'),
  keywords: varchar('keywords'), // JSON stringified array
  createdAt: date('createdAt').$defaultFn(() => new Date()),
  updatedAt: date('updatedAt').$defaultFn(() => new Date()),
}, (table) => [
  index('category_idx').on(table.category),
]);

// SessionState Schema (optional for tracking conversation state)
export const sessionStates = mongoCollection('sessionStates', {
  _id: varchar('_id').$defaultFn(() => new ObjectId().toString()),
  customerId: varchar('customerId'),
  mode: varchar('mode', { enum: ['bot', 'human'] }).$default('bot'),
  lastFaqId: varchar('lastFaqId'),
  lastModelTrace: varchar('lastModelTrace'), // JSON stringified trace
  updatedAt: date('updatedAt').$defaultFn(() => new Date()),
}, (table) => [
  index('customerId_idx').on(table.customerId),
]);

// Type exports for use in the application
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = typeof faqs.$inferInsert;

export type SessionState = typeof sessionStates.$inferSelect;
export type InsertSessionState = typeof sessionStates.$inferInsert;

