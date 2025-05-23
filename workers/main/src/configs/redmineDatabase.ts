import { z } from 'zod';

export const redmineDatabaseConfig = {
  host: process.env.REDMINE_DB_HOST,
  user: process.env.REDMINE_DB_USER,
  password: process.env.REDMINE_DB_PASSWORD,
  database: process.env.REDMINE_DB_NAME,
};

export const redmineDatabaseSchema = z.object({
  REDMINE_DB_HOST: z.string(),
  REDMINE_DB_USER: z.string(),
  REDMINE_DB_PASSWORD: z.string(),
  REDMINE_DB_NAME: z.string(),
});
