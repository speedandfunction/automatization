import mongoose, { Document } from 'mongoose';

import { Employee, Project } from './types';

// History schema: stores a map of rates (e.g., salary or billing rates) by key (date, type, etc.)
export const historySchema = new mongoose.Schema(
  {
    rate: { type: Map, of: Number },
  },
  { _id: false },
);

// Employee schema: represents an employee with a Redmine ID and a history of rates
export const employeeSchema = new mongoose.Schema({
  redmine_id: { type: Number, required: true, index: true },
  history: historySchema,
});

// EmployeeModel: Mongoose model for Employee documents
export const EmployeeModel = mongoose.model<Employee & Document>(
  'Employee',
  employeeSchema,
);

// Project schema: represents a project with Redmine and QuickBooks IDs, and a history of rates
export const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  redmine_id: { type: Number, required: true, index: true },
  quick_books_id: Number,
  history: historySchema,
});

// ProjectModel: Mongoose model for Project documents
export const ProjectModel = mongoose.model<Project & Document>(
  'Project',
  projectSchema,
);
