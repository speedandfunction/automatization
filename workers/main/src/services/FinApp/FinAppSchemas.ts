import mongoose from 'mongoose';

export const historySchema = new mongoose.Schema(
  {
    rate: { type: Map, of: Number },
  },
  { _id: false },
);

export const employeeSchema = new mongoose.Schema({
  redmine_id: { type: Number, required: true, index: true },
  history: historySchema,
});

export const EmployeeModel =
  mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

export const projectSchema = new mongoose.Schema({
  redmine_id: { type: Number, required: true, index: true },
  quick_books_id: Number,
  history: historySchema,
});

export const ProjectModel =
  mongoose.models.Project || mongoose.model('Project', projectSchema);
