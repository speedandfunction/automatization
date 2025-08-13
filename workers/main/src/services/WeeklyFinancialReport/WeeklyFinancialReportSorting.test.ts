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
    { redmine_id: 10, history: { rate: { '2024-01-01': 100 } } }, // 50% marginality (Low)
    { redmine_id: 20, history: { rate: { '2024-01-01': 200 } } }, // 75% marginality (High)
    { redmine_id: 30, history: { rate: { '2024-01-01': 150 } } }, // 67% marginality (Medium)
    { redmine_id: 40, history: { rate: { '2024-01-01': 180 } } }, // 72% marginality (High)
  ],
});

describe('WeeklyFinancialReportRepository Sorting', () => {
  const repo = new WeeklyFinancialReportRepository();

  it('sorts groups by marginality level (High -> Medium -> Low) then by groupName alphabetically', async () => {
    const testData = createLevelTestData();
    const { details, summary } = await repo.generateReport({
      targetUnits: testData.targetUnits,
      employees: testData.employees,
      projects: testData.projects,
    });

    const highGroupBIndex = details.indexOf('High Group B');
    const highGroupDIndex = details.indexOf('High Group D');
    const mediumGroupCIndex = details.indexOf('Medium Group C');
    const lowGroupAIndex = details.indexOf('Low Group A');

    // High groups should be first
    expect(highGroupBIndex).toBeLessThan(mediumGroupCIndex);
    expect(highGroupDIndex).toBeLessThan(mediumGroupCIndex);

    // Medium groups should be after High
    expect(mediumGroupCIndex).toBeLessThan(lowGroupAIndex);

    // Low groups should be last
    expect(lowGroupAIndex).toBeGreaterThan(highGroupBIndex);
    expect(lowGroupAIndex).toBeGreaterThan(highGroupDIndex);
    expect(lowGroupAIndex).toBeGreaterThan(mediumGroupCIndex);

    // Within same marginality level, groups should be sorted alphabetically
    // "High Group B" should come before "High Group D" alphabetically
    expect(highGroupBIndex).toBeLessThan(highGroupDIndex);

    const highGroupBIndexSummary = summary.indexOf('High Group B');
    const mediumGroupCIndexSummary = summary.indexOf('Medium Group C');
    const lowGroupAIndexSummary = summary.indexOf('Low Group A');

    expect(highGroupBIndexSummary).toBeLessThan(mediumGroupCIndexSummary);
    expect(mediumGroupCIndexSummary).toBeLessThan(lowGroupAIndexSummary);
  });
});
