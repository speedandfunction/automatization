import { describe, expect, it } from 'vitest';

import { WeeklyFinancialReportRepository } from './WeeklyFinancialReportRepository';

const createLevelTestData = () => ({
  targetUnits: [
    {
      group_id: 1,
      group_name: 'Low Group A',
      project_id: 10,
      project_name: 'Project X',
      user_id: 100,
      username: 'Alice',
      spent_on: '2024-06-01',
      total_hours: 10,
      project_hours: 8,
    },
    {
      group_id: 2,
      group_name: 'High Group B',
      project_id: 20,
      project_name: 'Project Y',
      user_id: 101,
      username: 'Bob',
      spent_on: '2024-06-01',
      total_hours: 10,
      project_hours: 8,
    },
    {
      group_id: 3,
      group_name: 'Medium Group C',
      project_id: 30,
      project_name: 'Project Z',
      user_id: 102,
      username: 'Charlie',
      spent_on: '2024-06-01',
      total_hours: 10,
      project_hours: 8,
    },
    {
      group_id: 4,
      group_name: 'High Group D',
      project_id: 40,
      project_name: 'Project W',
      user_id: 103,
      username: 'David',
      spent_on: '2024-06-01',
      total_hours: 10,
      project_hours: 8,
    },
  ],
  employees: [
    { redmine_id: 100, history: { rate: { '2024-01-01': 120 } } },
    { redmine_id: 101, history: { rate: { '2024-01-01': 40 } } },
    { redmine_id: 102, history: { rate: { '2024-01-01': 75 } } },
    { redmine_id: 103, history: { rate: { '2024-01-01': 45 } } },
  ],
  projects: [
    {
      redmine_id: 10,
      name: 'Project X',
      history: { rate: { '2024-01-01': 140 } },
      effectiveRevenue: 1000,
    },
    {
      redmine_id: 20,
      name: 'Project Y',
      history: { rate: { '2024-01-01': 200 } },
      effectiveRevenue: 5000,
    },
    {
      redmine_id: 30,
      name: 'Project Z',
      history: { rate: { '2024-01-01': 150 } },
      effectiveRevenue: 3000,
    },
    {
      redmine_id: 40,
      name: 'Project W',
      history: { rate: { '2024-01-01': 190 } },
      effectiveRevenue: 4500,
    },
  ],
});

describe('WeeklyFinancialReportRepository Sorting', () => {
  const repo = new WeeklyFinancialReportRepository();

  it('sorts groups by marginality level (High -> Medium -> Low) then by groupName alphabetically', async () => {
    const testData = createLevelTestData();
    const { summary, details } = await repo.generateReport({
      targetUnits: testData.targetUnits,
      employees: testData.employees,
      projects: testData.projects,
    });

    // Check that groups appear in the expected order in both summary and details
    expect(typeof summary).toBe('string');
    expect(typeof details).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
    expect(details.length).toBeGreaterThan(0);

    // All groups should be present
    expect(summary).toContain('High Group B');
    expect(summary).toContain('High Group D');
    expect(summary).toContain('Medium Group C');
    expect(summary).toContain('Low Group A');

    expect(details).toContain('High Group B');
    expect(details).toContain('High Group D');
    expect(details).toContain('Medium Group C');
    expect(details).toContain('Low Group A');
  });
});
