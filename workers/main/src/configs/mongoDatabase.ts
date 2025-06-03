import { z } from 'zod';

export const mongoDatabaseConfig = {
  host: process.env.MONGO_DB_HOST,
  user: process.env.MONGO_DB_USER,
  password: process.env.MONGO_DB_PASSWORD,
  database: process.env.MONGO_DB_NAME,
};

export const mongoDatabaseSchema = z.object({
  MONGO_DB_HOST: z.string(),
  MONGO_DB_USER: z.string(),
  MONGO_DB_PASSWORD: z.string(),
  MONGO_DB_NAME: z.string(),
});
