import { AppError } from './AppError';

export class QuickBooksRepositoryError extends AppError {
  constructor(message: string) {
    super(message, 'QuickBooksRepositoryError');
  }
}
