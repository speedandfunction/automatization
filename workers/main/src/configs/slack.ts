import { z } from 'zod';

export const slackConfig = {
  token: process.env.SLACK_TOKEN,
  channelId: process.env.SLACK_FIN_REPORT_CHANNEL_ID,
};

export const slackSchema = z.object({
  SLACK_TOKEN: z.string(),
  SLACK_FIN_REPORT_CHANNEL_ID: z.string(),
});
