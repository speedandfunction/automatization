import { AppError } from './AppError';

export class SlackRepositoryError extends AppError {
  constructor(message: string) {
    super(message, 'SlackRepositoryError');
  }
}
