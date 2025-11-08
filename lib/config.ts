import { z } from 'zod';

const configSchema = z.object({
  mongodb: z.object({
    uri: z.string().min(1, 'MONGODB_URI is required'),
  }),
  auth: z.object({
    nextAuthSecret: z.string().min(1, 'NEXTAUTH_SECRET is required'),
    dashboardJwtSecret: z.string().min(1, 'DASHBOARD_JWT_SECRET is required'),
  }),
  whatsapp: z.object({
    verifyToken: z.string().min(1, 'WHATSAPP_VERIFY_TOKEN is required'),
    accessToken: z.string().min(1, 'WHATSAPP_ACCESS_TOKEN is required'),
    phoneNumberId: z.string().min(1, 'WHATSAPP_PHONE_NUMBER_ID is required'),
  }),
  perplexity: z.object({
    apiKey: z.string().min(1, 'PERPLEXITY_API_KEY is required'),
  }),
  app: z.object({
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
    port: z.coerce.number().default(3000),
    socketUrl: z.string().default('http://localhost:3000'),
  }),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config = {
    mongodb: {
      uri: process.env.MONGODB_URI || '',
    },
    auth: {
      nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
      dashboardJwtSecret: process.env.DASHBOARD_JWT_SECRET || '',
    },
    whatsapp: {
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    },
    perplexity: {
      apiKey: process.env.PERPLEXITY_API_KEY || '',
    },
    app: {
      nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
    },
  };

  const result = configSchema.safeParse(config);

  if (!result.success) {
    console.error('Configuration validation failed:', result.error.format());
    throw new Error('Invalid configuration. Check your environment variables.');
  }

  cachedConfig = result.data;
  return cachedConfig;
}

// Safe getter for client-side (only returns public config)
export function getPublicConfig() {
  return {
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
  };
}

