import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';

import { EmployeeModel, historySchema, ProjectModel } from './FinAppSchemas';

// Helper to validate a model instance without saving to DB
async function validateDoc(
  doc: mongoose.Document,
): Promise<mongoose.Error.ValidationError | null> {
  try {
    await doc.validate();

    return null;
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      return err;
    }
    throw err; // rethrow unexpected errors
  }
}

describe('FinApp Schemas', () => {
  describe('EmployeeModel', () => {
    it('should require redmine_id', async () => {
      const doc = new EmployeeModel({});
      const err = await validateDoc(doc);

      expect(err).toBeTruthy();
      expect(err?.errors.redmine_id).toBeDefined();
    });

    it('should accept valid employee', async () => {
      const doc = new EmployeeModel({
        redmine_id: 123,
        history: { rate: { '2024-01-01': 100 } },
      });
      const err = await validateDoc(doc);

      expect(err).toBeNull();
    });

    it('should reject non-number redmine_id', async () => {
      const doc = new EmployeeModel({ redmine_id: 'abc' });
      const err = await validateDoc(doc);

      expect(err).toBeTruthy();
      expect(err?.errors.redmine_id).toBeDefined();
    });
  });

  describe('ProjectModel', () => {
    it('should require redmine_id', async () => {
      const doc = new ProjectModel({});
      const err = await validateDoc(doc);

      expect(err).toBeTruthy();
      expect(err?.errors.redmine_id).toBeDefined();
    });

    it('should accept valid project', async () => {
      const doc = new ProjectModel({
        name: 'Test Project',
        redmine_id: 456,
        quick_books_id: 789,
        history: { rate: { '2024-01-01': 200 } },
      });
      const err = await validateDoc(doc);

      expect(err).toBeNull();
    });

    it('should reject non-number redmine_id', async () => {
      const doc = new ProjectModel({ redmine_id: 'xyz' });
      const err = await validateDoc(doc);

      expect(err).toBeTruthy();
      expect(err?.errors.redmine_id).toBeDefined();
    });
  });

  describe('historySchema', () => {
    it('should accept a valid history object', async () => {
      const TestModel = mongoose.model(
        'TestHistory',
        new mongoose.Schema({ history: historySchema }),
      );
      const doc = new TestModel({ history: { rate: { '2024-01-01': 123 } } });
      const err = await validateDoc(doc);

      expect(err).toBeNull();
      mongoose.deleteModel('TestHistory');
    });

    it('should reject non-number rate values', async () => {
      const TestModel = mongoose.model(
        'TestHistory2',
        new mongoose.Schema({ history: historySchema }),
      );
      const doc = new TestModel({
        history: { rate: { '2024-01-01': 'not-a-number' } },
      });
      const err = await validateDoc(doc);

      expect(err).toBeTruthy();
      mongoose.deleteModel('TestHistory2');
    });
  });
});
