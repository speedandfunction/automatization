import { z } from 'zod';

export const qboConfig = {
  apiUrl: process.env.QBO_API_URL,
  bearerToken: process.env.QBO_BEARER_TOKEN,
  // OAuth2 configuration
  clientId: process.env.QBO_CLIENT_ID,
  clientSecret: process.env.QBO_CLIENT_SECRET,
  companyId: process.env.QBO_COMPANY_ID,
  refreshToken: process.env.QBO_REFRESH_TOKEN,
  tokenEndpoint:
    process.env.QBO_TOKEN_ENDPOINT ||
    'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
};

export const qboSchema = z.object({
  QBO_API_URL: z.string().url().min(1, 'QBO_API_URL is required'),
  QBO_CLIENT_ID: z.string().min(1, 'QBO_CLIENT_ID is required'),
  QBO_CLIENT_SECRET: z.string().min(1, 'QBO_CLIENT_SECRET is required'),
  QBO_COMPANY_ID: z.string().min(1, 'QBO_COMPANY_ID is required'),
  QBO_REFRESH_TOKEN: z.string().optional(),
});
