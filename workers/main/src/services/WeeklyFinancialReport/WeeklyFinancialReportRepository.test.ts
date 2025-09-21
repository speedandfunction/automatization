import { describe, expect, it } from 'vitest';

import { WeeklyFinancialReportRepository } from './WeeklyFinancialReportRepository';

const createBasicTestData = () => ({
  targetUnits: [
    {
      group_id: 1,
      group_name: 'Group A',
      project_id: 10,
      project_name: 'Project X',
      user_id: 100,
      username: 'Alice',
      spent_on: '2024-06-01',
      total_hours: 8,
    },
    {
      group_id: 1,
      group_name: 'Group A',
      project_id: 10,
      project_name: 'Project X',
      user_id: 101,
      username: 'Bob',
      spent_on: '2024-06-01',
      total_hours: 4,
    },
    {
      group_id: 2,
      group_name: 'Group B',
      project_id: 20,
      project_name: 'Project Y',
      user_id: 102,
      username: 'Charlie',
      spent_on: '2024-06-01',
      total_hours: 5,
    },
    {
      group_id: 3,
      group_name: 'Group C',
      project_id: 30,
      project_name: 'Project Z',
      user_id: 103,
      username: 'David',
      spent_on: '2024-06-01',
      total_hours: 100,
    },
    {
      group_id: 4,
      group_name: 'Group D',
      project_id: 40,
      project_name: 'Project W',
      user_id: 104,
      username: 'Eve',
      spent_on: '2024-06-01',
      total_hours: 10,
    },
  ],
  employees: [
    { redmine_id: 100, history: { rate: { '2024-01-01': 100 } } },
    { redmine_id: 101, history: { rate: { '2024-01-01': 200 } } },
    { redmine_id: 102, history: { rate: { '2024-01-01': 300 } } },
    { redmine_id: 103, history: { rate: { '2024-01-01': 900 } } },
    { redmine_id: 104, history: { rate: { '2024-01-01': 700 } } },
  ],
  projects: [
    {
      redmine_id: 10,
      name: 'Project X',
      history: { rate: { '2024-01-01': 500 } },
    },
    {
      redmine_id: 20,
      name: 'Project Y',
      history: { rate: { '2024-01-01': 1000 } },
    },
    {
      redmine_id: 30,
      name: 'Project Z',
      history: { rate: { '2024-01-01': 1500 } },
    },
    {
      redmine_id: 40,
      name: 'Project W',
      history: { rate: { '2024-01-01': 1300 } },
    },
  ],
});

describe('WeeklyFinancialReportRepository', () => {
  const repo = new WeeklyFinancialReportRepository();

  it('generates a report with summary and details', async () => {
    const testData = createBasicTestData();
    const { summary, details } = await repo.generateReport({
      targetUnits: testData.targetUnits,
      employees: testData.employees,
      projects: testData.projects,
    });

    expect(typeof summary).toBe('string');
    expect(typeof details).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
    expect(details.length).toBeGreaterThan(0);

    expect(summary).toContain('Weekly Financial Summary for Target Units');
    expect(summary).toContain('Marginality is 55% or higher');
    expect(summary).toContain('Marginality is between 45-55%');
    expect(summary).toContain('Marginality is under 45%');
    expect(summary).toContain(
      'The specific figures will be available in the thread',
    );
    expect(summary).toContain('Group A');
    expect(summary).toContain('Group B');
    expect(summary).toContain('Group C');
    expect(summary).toContain('Group D');

    expect(details).toContain('Group A');
    expect(details).toContain('Group B');
    expect(details).toContain('Group C');
    expect(details).toContain('Group D');
    expect(details).toMatch(/period: Q\d/);
    expect(details).toContain('Revenue');
    expect(details).toContain('COGS');
    expect(details).toContain('Margin');
    expect(details).toContain('Marginality');
    expect(details).toContain('Notes:');
    expect(details).toContain('Effective Revenue');
    expect(details).toContain('Legend');
    // Marginality indicators
    expect(details).toMatch(/:arrow(up|down):|:large_yellow_circle:/);
    // Check for correct currency formatting
    expect(details).toMatch(/\$[\d,]+/);
  });

  it('handles empty input arrays', async () => {
    const { summary, details } = await repo.generateReport({
      targetUnits: [],
      employees: [],
      projects: [],
    });

    expect(typeof summary).toBe('string');
    expect(typeof details).toBe('string');
    // No total hours output when there are no groups
    expect(details).toContain('Notes:');
    expect(details).toContain('Legend');
    expect(summary).toContain('Weekly Financial Summary for Target Units');
  });

  it('sorts groups alphabetically within the same marginality level', async () => {
    // Create test data with groups that have the same marginality level
    // but different names to test alphabetical sorting
    const testData = {
      targetUnits: [
        {
          group_id: 1,
          group_name: 'Zebra Group',
          project_id: 10,
          project_name: 'Project X',
          user_id: 100,
          username: 'Alice',
          spent_on: '2024-06-01',
          total_hours: 10,
        },
        {
          group_id: 2,
          group_name: 'Alpha Group',
          project_id: 20,
          project_name: 'Project Y',
          user_id: 101,
          username: 'Bob',
          spent_on: '2024-06-01',
          total_hours: 10,
        },
        {
          group_id: 3,
          group_name: 'Beta Group',
          project_id: 30,
          project_name: 'Project Z',
          user_id: 102,
          username: 'Charlie',
          spent_on: '2024-06-01',
          total_hours: 10,
        },
      ],
      employees: [
        { redmine_id: 100, history: { rate: { '2024-01-01': 50 } } },
        { redmine_id: 101, history: { rate: { '2024-01-01': 50 } } },
        { redmine_id: 102, history: { rate: { '2024-01-01': 50 } } },
      ],
      projects: [
        // All projects have same marginality level (High) with rate 200 and cogs 50*10=500
        // (2000-500)/2000 = 75% marginality
        {
          redmine_id: 10,
          name: 'Project X',
          history: { rate: { '2024-01-01': 200 } },
        },
        {
          redmine_id: 20,
          name: 'Project Y',
          history: { rate: { '2024-01-01': 200 } },
        },
        {
          redmine_id: 30,
          name: 'Project Z',
          history: { rate: { '2024-01-01': 200 } },
        },
      ],
    };
    const { details } = await repo.generateReport({
      targetUnits: testData.targetUnits,
      employees: testData.employees,
      projects: testData.projects,
    });

    // Since all groups have the same marginality level, they should be sorted alphabetically
    const alphaGroupIndex = details.indexOf('Alpha Group');
    const betaGroupIndex = details.indexOf('Beta Group');
    const zebraGroupIndex = details.indexOf('Zebra Group');

    // Alpha should come first, then Beta, then Zebra (alphabetical order)
    expect(alphaGroupIndex).toBeLessThan(betaGroupIndex);
    expect(betaGroupIndex).toBeLessThan(zebraGroupIndex);
  });
});
