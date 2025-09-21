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

    // Verify all groups are present
    expect(summary).toContain('High Group B');
    expect(summary).toContain('High Group D');
    expect(summary).toContain('Medium Group C');
    expect(summary).toContain('Low Group A');

    expect(details).toContain('High Group B');
    expect(details).toContain('High Group D');
    expect(details).toContain('Medium Group C');
    expect(details).toContain('Low Group A');

    // Verify sorting order if the groups appear in different marginality sections
    // This is a more flexible approach that works with the actual calculation results
    const summaryLines = summary.split('\n');
    const detailsLines = details.split('\n');
    
    // Find the positions of each group in the output
    const groupPositions = {
      'High Group B': { summary: summaryLines.findIndex(line => line.includes('High Group B')), details: detailsLines.findIndex(line => line.includes('High Group B')) },
      'High Group D': { summary: summaryLines.findIndex(line => line.includes('High Group D')), details: detailsLines.findIndex(line => line.includes('High Group D')) },
      'Medium Group C': { summary: summaryLines.findIndex(line => line.includes('Medium Group C')), details: detailsLines.findIndex(line => line.includes('Medium Group C')) },
      'Low Group A': { summary: summaryLines.findIndex(line => line.includes('Low Group A')), details: detailsLines.findIndex(line => line.includes('Low Group A')) }
    };

    // Verify that groups are ordered consistently in both summary and details
    // High groups should come before Medium, Medium before Low
    // Within the same level, alphabetical order (B before D)
    const highGroups = ['High Group B', 'High Group D'];
    const mediumGroups = ['Medium Group C'];
    const lowGroups = ['Low Group A'];

    // Check that high groups come before medium groups
    highGroups.forEach(highGroup => {
      mediumGroups.forEach(mediumGroup => {
        if (groupPositions[highGroup].summary >= 0 && groupPositions[mediumGroup].summary >= 0) {
          expect(groupPositions[highGroup].summary).toBeLessThan(groupPositions[mediumGroup].summary);
        }
        if (groupPositions[highGroup].details >= 0 && groupPositions[mediumGroup].details >= 0) {
          expect(groupPositions[highGroup].details).toBeLessThan(groupPositions[mediumGroup].details);
        }
      });
    });

    // Check that medium groups come before low groups
    mediumGroups.forEach(mediumGroup => {
      lowGroups.forEach(lowGroup => {
        if (groupPositions[mediumGroup].summary >= 0 && groupPositions[lowGroup].summary >= 0) {
          expect(groupPositions[mediumGroup].summary).toBeLessThan(groupPositions[lowGroup].summary);
        }
        if (groupPositions[mediumGroup].details >= 0 && groupPositions[lowGroup].details >= 0) {
          expect(groupPositions[mediumGroup].details).toBeLessThan(groupPositions[lowGroup].details);
        }
      });
    });

    // Check alphabetical order within high groups (B before D)
    if (groupPositions['High Group B'].summary >= 0 && groupPositions['High Group D'].summary >= 0) {
      expect(groupPositions['High Group B'].summary).toBeLessThan(groupPositions['High Group D'].summary);
    }
    if (groupPositions['High Group B'].details >= 0 && groupPositions['High Group D'].details >= 0) {
      expect(groupPositions['High Group B'].details).toBeLessThan(groupPositions['High Group D'].details);
    }
  });
});
