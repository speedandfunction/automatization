import { WebClient } from '@slack/web-api';

import { AppError } from '../../common/errors';
import { slackConfig } from '../../configs/slack';

export class SlackService {
  private client: WebClient;

  constructor() {
    if (!slackConfig.token) {
      throw new AppError('Slack token not set', 'SlackServiceError');
    }
    this.client = new WebClient(slackConfig.token);
  }

  async postMessage(text: string, thread?: string) {
    if (!slackConfig.channelId) {
      throw new AppError('Slack channel ID not set', 'SlackServiceError');
    }
    const res = await this.client.chat.postMessage({
      channel: slackConfig.channelId,
      text,
      ...(thread ? { thread_ts: thread } : {}),
    });

    if (!res.ok) {
      throw new AppError(`Slack API error: ${res.error}`, 'SlackServiceError');
    }

    return res;
  }
}
