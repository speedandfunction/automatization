import { describe, expect, it } from 'vitest';

import { WeeklyFinancialReportRepository } from './WeeklyFinancialReportRepository';

describe('WeeklyFinancialReportRepository', () => {
  const repo = new WeeklyFinancialReportRepository();

  const targetUnits = [
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
  ];
  const employees = [
    { redmine_id: 100, history: { rate: { '2024-01-01': 100 } } },
    { redmine_id: 101, history: { rate: { '2024-01-01': 200 } } },
    { redmine_id: 102, history: { rate: { '2024-01-01': 300 } } },
    { redmine_id: 103, history: { rate: { '2024-01-01': 900 } } },
    { redmine_id: 104, history: { rate: { '2024-01-01': 700 } } },
  ];
  const projects = [
    { redmine_id: 10, history: { rate: { '2024-01-01': 500 } } },
    { redmine_id: 20, history: { rate: { '2024-01-01': 1000 } } },
    { redmine_id: 30, history: { rate: { '2024-01-01': 1500 } } },
    { redmine_id: 40, history: { rate: { '2024-01-01': 1300 } } },
  ];

  it('generates a report with summary and details', async () => {
    const { summary, details } = await repo.generateReport({
      targetUnits,
      employees,
      projects,
    });

    expect(typeof summary).toBe('string');
    expect(typeof details).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
    expect(details.length).toBeGreaterThan(0);

    // Check summary content
    expect(summary).toContain('Weekly Financial Summary for Target Units');
    expect(summary).toContain('Marginality is 55% or higher');
    expect(summary).toContain('Marginality is between 45-55%');
    expect(summary).toContain('Marginality is under 45%');
    expect(summary).toContain(
      'The specific figures will be available in the thread',
    );
    // Group names should appear in summary
    expect(summary).toContain('Group A');
    expect(summary).toContain('Group B');
    expect(summary).toContain('Group C');
    expect(summary).toContain('Group D');

    // Check details content
    expect(details).toContain('Total hours');
    expect(details).toContain('Group A');
    expect(details).toContain('Group B');
    expect(details).toContain('Group C');
    expect(details).toContain('Group D');
    expect(details).toMatch(/\*Period\*: Q\d/);
    expect(details).toContain('Revenue');
    expect(details).toContain('COGS');
    expect(details).toContain('Margin');
    expect(details).toContain('Marginality');
    expect(details).toContain('Notes:');
    expect(details).toContain('Contract Type');
    expect(details).toContain('Effective Revenue');
    expect(details).toContain('Dept Tech');
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
    expect(details).toContain('*Total hours*: 0h');
    expect(details).toContain('Notes:');
    expect(details).toContain('Legend');
    expect(summary).toContain('Weekly Financial Summary for Target Units');
  });
});
