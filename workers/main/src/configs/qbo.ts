import { z } from 'zod';

export const qboConfig = {
  apiUrl: process.env.QBO_API_URL,
  bearerToken: process.env.QBO_BEARER_TOKEN,
};

export const qboSchema = z.object({
  QBO_API_URL: z.string().url(),
  QBO_BEARER_TOKEN: z.string(),
});
