import { MongoClient } from 'mongodb';
import { drizzle } from 'drizzle-orm/mongo';
import { getConfig } from '@/lib/config';
import * as schema from './schema';

let client: MongoClient | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (db && client) {
    return db;
  }

  const config = getConfig();
  
  client = new MongoClient(config.mongodb.uri);
  await client.connect();
  
  db = drizzle(client.db(), { schema });
  
  return db;
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

// Re-export schema for convenience
export * from './schema';

