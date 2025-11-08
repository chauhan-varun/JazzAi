import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'mongodb',
  dbCredentials: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/luna-ai',
  },
});

