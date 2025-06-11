import { WebClient } from '@slack/web-api';
import { slackConfig } from '../configs/slack';
import { AppError } from '../common/errors';

export class SlackService {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(slackConfig.token);
  }

  async postMessage(text: string, thread?: string) {
    if (!slackConfig.channelId) {
      throw new AppError('Slack channel ID not set', 'SlackServiceError');
    }
    return this.client.chat.postMessage({
      channel: slackConfig.channelId,
      text,
      thread_ts: thread,
    });
  }
} 