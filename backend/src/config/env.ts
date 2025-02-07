import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.string().default('4000'),
	MONGODB_URI: z.string(),
	REDIS_URL: z.string(),
	N8N_WEBHOOK_URL: z.string()
});

export const config = envSchema.parse(process.env);
