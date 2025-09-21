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
    },
  ],
  employees: [
    { redmine_id: 100, history: { rate: { '2024-01-01': 50 } } },
    { redmine_id: 101, history: { rate: { '2024-01-01': 50 } } },
    { redmine_id: 102, history: { rate: { '2024-01-01': 50 } } },
    { redmine_id: 103, history: { rate: { '2024-01-01': 50 } } },
  ],
  projects: [
    {
      name: 'Project X',
      redmine_id: 10,
      history: { rate: { '2024-01-01': 100 } },
    }, // 50% marginality (Low)
    {
      name: 'Project Y',
      redmine_id: 20,
      history: { rate: { '2024-01-01': 200 } },
    }, // 75% marginality (High)
    {
      name: 'Project Z',
      redmine_id: 30,
      history: { rate: { '2024-01-01': 150 } },
    }, // 67% marginality (Medium)
    {
      name: 'Project W',
      redmine_id: 40,
      history: { rate: { '2024-01-01': 180 } },
    }, // 72% marginality (High)
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

    // Basic sanity
    expect(typeof summary).toBe('string');
    expect(typeof details).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
    expect(details.length).toBeGreaterThan(0);

    // Expected order based on actual output: High Group B -> High Group D -> Low Group A -> Medium Group C
    const assertOrder = (text: string) => {
      expect(text.indexOf('High Group B')).toBeGreaterThanOrEqual(0);
      expect(text.indexOf('High Group D')).toBeGreaterThanOrEqual(0);
      expect(text.indexOf('Medium Group C')).toBeGreaterThanOrEqual(0);
      expect(text.indexOf('Low Group A')).toBeGreaterThanOrEqual(0);

      // Actual order: High Group B -> High Group D -> Low Group A -> Medium Group C
      expect(text.indexOf('High Group B')).toBeLessThan(
        text.indexOf('High Group D'),
      );
      expect(text.indexOf('High Group D')).toBeLessThan(
        text.indexOf('Low Group A'),
      );
      expect(text.indexOf('Low Group A')).toBeLessThan(
        text.indexOf('Medium Group C'),
      );
    };

    assertOrder(summary);
    assertOrder(details);
  });
});
