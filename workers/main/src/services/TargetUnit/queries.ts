export const getTargetUnitsQuery = `SELECT
    group_id,
    group_name,
    project_id,
    project_name,
    user_id,
    username,
    DATE_FORMAT(spent_on, '%Y-%m-%d') AS spent_on,
    SUM(total_hours) AS total_hours
  FROM (
    SELECT
      g.id AS group_id,
      g.lastname AS group_name,
      p.id AS project_id,
      p.name AS project_name,
      te.user_id AS user_id,
      CONCAT(u.firstname, ' ', u.lastname) AS username,
      te.spent_on AS spent_on,
      te.hours AS total_hours
    FROM users AS g
    JOIN custom_values as cv ON  cv.customized_id = g.id
    JOIN members AS m ON m.user_id = g.id
    JOIN projects AS p ON p.id = m.project_id
    JOIN time_entries te ON te.project_id = p.id
    JOIN users AS u ON u.id = te.user_id
    WHERE g.type = 'Group'
      AND cv.customized_type = 'Principal' and cv.value = ?
      AND te.spent_on BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 7 DAY)
                          AND DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 1 DAY)
  ) t
  GROUP BY
    group_id,
    group_name,
    project_id,
    project_name,
    user_id,
    username,
    spent_on
  ORDER BY
    group_name ASC,
    project_name ASC,
    username ASC,
    spent_on ASC`;
