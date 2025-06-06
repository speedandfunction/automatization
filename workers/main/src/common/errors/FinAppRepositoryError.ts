import { AppError } from './AppError';

export class FinAppRepositoryError extends AppError {
  constructor(message: string) {
    super(message, 'FinAppRepositoryError');
  }
}
