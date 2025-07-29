import { z } from 'zod';

export const qboConfig = {
  apiUrl: process.env.QBO_API_URL,
  bearerToken: process.env.QBO_BEARER_TOKEN,
  // OAuth2 configuration
  clientId: process.env.QBO_CLIENT_ID,
  clientSecret: process.env.QBO_CLIENT_SECRET,
  refreshToken: process.env.QBO_REFRESH_TOKEN,
  tokenEndpoint: process.env.QBO_TOKEN_ENDPOINT || 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  companyId: process.env.QBO_COMPANY_ID,
};

export const qboSchema = z.object({
  QBO_API_URL: z.string().url(),
  QBO_BEARER_TOKEN: z.string().optional(),
  // OAuth2 schema
  QBO_CLIENT_ID: z.string(),
  QBO_CLIENT_SECRET: z.string(),
  QBO_REFRESH_TOKEN: z.string(),
  QBO_TOKEN_ENDPOINT: z.string().url().optional(),
  QBO_COMPANY_ID: z.string(),
});
