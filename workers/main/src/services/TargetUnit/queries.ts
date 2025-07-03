import {
  GroupNameEnum,
  RELATED_PROJECT_FIELD_ID,
  REPORT_FILTER_FIELD_ID,
} from '../../configs/weeklyFinancialReport';

const groupNamesList = Object.values(GroupNameEnum)
  .map((name) => `'${name.replace(/'/g, "''")}'`)
  .join(', ');

const COMMON_SELECT = `
  SELECT
    g.id AS group_id,
    g.lastname AS group_name,
    p.id AS project_id,
    p.name AS project_name,
    te.user_id AS user_id,
    CONCAT(u.firstname, ' ', u.lastname) AS username,
    te.spent_on AS spent_on,
    cv.value AS filter_name,
`;

const COMMON_FROM = `
    FROM users AS g
        JOIN custom_values as cv ON cv.customized_id = g.id
        JOIN members AS m ON m.user_id = g.id
        JOIN projects AS p ON p.id = m.project_id
`;

const COMMON_WHERE = `
    WHERE g.type = 'Group'
      AND cv.customized_type = 'Principal'
      AND cv.custom_field_id = ${REPORT_FILTER_FIELD_ID}
      AND cv.value IN (${groupNamesList})
      AND te.spent_on BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 7 DAY)
                          AND DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 1 DAY)
`;

function buildDirectGroupTimeEntries() {
  return `
    ${COMMON_SELECT}
    te.hours AS project_hours,
    0 as deptech_hours
    ${COMMON_FROM}
        JOIN time_entries te ON te.project_id = p.id
        JOIN users AS u ON u.id = te.user_id
    ${COMMON_WHERE}
  `;
}

function buildRelatedProjectTimeEntries() {
  return `
    ${COMMON_SELECT}
    0 as project_hours,
    te.hours AS deptech_hours
    ${COMMON_FROM}
        JOIN custom_values icv ON icv.value = CAST(p.id AS CHAR)
          AND icv.customized_type = 'Issue'
          AND icv.custom_field_id = ${RELATED_PROJECT_FIELD_ID}
          AND icv.value <> ""
        JOIN time_entries te ON te.issue_id = icv.customized_id
        JOIN users AS u ON u.id = te.user_id
    ${COMMON_WHERE}
  `;
}

export const TARGET_UNITS_QUERY = `
  SELECT
    group_id,
    group_name,
    project_id,
    project_name,
    user_id,
    username,
    DATE_FORMAT(spent_on, '%Y-%m-%d') AS spent_on,
    SUM(project_hours) AS project_hours,
    SUM(deptech_hours) AS deptech_hours,
    SUM(project_hours) + SUM(deptech_hours) AS total_hours,
    filter_name
  FROM (
    ${buildDirectGroupTimeEntries()}
    UNION ALL
    ${buildRelatedProjectTimeEntries()}
  ) t
  GROUP BY
    t.group_id,
    t.group_name,
    t.project_id,
    t.project_name,
    t.user_id,
    t.username,
    t.spent_on
  ORDER BY
    t.group_name ASC,
    t.project_name ASC,
    t.username ASC,
    t.spent_on ASC
`;
