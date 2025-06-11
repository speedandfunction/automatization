import { WebClient } from '@slack/web-api';

import { SlackRepositoryError } from '../../common/errors';
import { slackConfig } from '../../configs/slack';

export class SlackService {
  private client: WebClient;

  constructor() {
    if (!slackConfig.token) {
      throw new SlackRepositoryError('Slack token not set');
    }
    this.client = new WebClient(slackConfig.token);
  }

  async postMessage(text: string, thread?: string) {
    if (!slackConfig.channelId) {
      throw new SlackRepositoryError('Slack channel ID not set');
    }
    let res;

    try {
      res = await this.client.chat.postMessage({
        channel: slackConfig.channelId,
        text,
        ...(thread ? { thread_ts: thread } : {}),
      });
    } catch (error) {
      throw new SlackRepositoryError(
        `SlackService.postMessage failed: ${(error as Error).message}`,
      );
    }

    if (!res.ok) {
      throw new SlackRepositoryError(`Slack API error: ${res.error}`);
    }

    return res;
  }

  public getClientForTest() {
    return this.client;
  }
}
