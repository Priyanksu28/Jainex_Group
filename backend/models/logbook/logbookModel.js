const db = require("../../config/db.js");

// 1. Create a new log entry
exports.createLogEntry = async (data) => {
  const query = `
    INSERT INTO crane_logbook 
      (month, logbook_date, site_id, crane_number_id, start_time, end_time,
       hours_start, hours_end, kmh_start, kmh_end,
       work_description, site_incharge_sign, operator_sign, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const parseNumOrNull = (v) => (v !== undefined && v !== '' && v !== null && !isNaN(v)) ? parseFloat(v) : null;

  const [result] = await db.execute(query, [
    data.month,
    data.logbook_date,
    data.site_id,
    data.crane_number_id,
    data.start_time || null,
    data.end_time || null,
    parseNumOrNull(data.hours_start),
    parseNumOrNull(data.hours_end),
    parseNumOrNull(data.kmh_start),
    parseNumOrNull(data.kmh_end),
    data.work_description,
    data.site_incharge_sign || null,
    data.operator_sign || null,
    data.remarks || null
  ]);

  return result.insertId;
};

// 2. Update a log entry
exports.updateLogEntry = async (id, data) => {
  const query = `
    UPDATE crane_logbook
    SET month = ?,
        logbook_date = ?,
        site_id = ?,
        crane_number_id = ?,
        start_time = ?,
        end_time = ?,
        hours_start = ?,
        hours_end = ?,
        kmh_start = ?,
        kmh_end = ?,
        work_description = ?,
        site_incharge_sign = ?,
        operator_sign = ?,
        remarks = ?
    WHERE id = ?
  `;

  const parseNumOrNull = (v) => (v !== undefined && v !== '' && v !== null && !isNaN(v)) ? parseFloat(v) : null;

  return db.execute(query, [
    data.month,
    data.logbook_date,
    data.site_id,
    data.crane_number_id,
    data.start_time || null,
    data.end_time || null,
    parseNumOrNull(data.hours_start),
    parseNumOrNull(data.hours_end),
    parseNumOrNull(data.kmh_start),
    parseNumOrNull(data.kmh_end),
    data.work_description,
    data.site_incharge_sign || null,
    data.operator_sign || null,
    data.remarks || null,
    id
  ]);
};

// 3. Delete a log entry
exports.deleteLogEntry = async (id) => {
  return db.execute("DELETE FROM crane_logbook WHERE id = ?", [id]);
};

// 4. Get a single log entry by ID with Crane & Site details
exports.getLogEntryById = async (id) => {
  const query = `
    SELECT l.*,
           c.reg_no as crane_reg_no, c.model as crane_model, c.capacity as crane_capacity,
           s.site_name, s.client_name as party_name, s.site_code, s.site_incharge_name
    FROM crane_logbook l
    LEFT JOIN cranes c ON l.crane_number_id = c.id
    LEFT JOIN sites s ON l.site_id = s.id
    WHERE l.id = ?
  `;
  const [rows] = await db.execute(query, [id]);
  return rows[0] || null;
};

// 5. Get Monthly Sheet for specific Crane & Month (or Site)
exports.getMonthlySheet = async ({ crane_number_id, crane_reg_no, month, site_id }) => {
  let conditions = [];
  let params = [];

  if (crane_number_id) {
    conditions.push("l.crane_number_id = ?");
    params.push(crane_number_id);
  } else if (crane_reg_no) {
    conditions.push("c.reg_no = ?");
    params.push(crane_reg_no);
  }

  if (month) {
    conditions.push("l.month = ?");
    params.push(month);
  }

  if (site_id) {
    conditions.push("l.site_id = ?");
    params.push(site_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `
    SELECT l.*,
           c.reg_no as crane_reg_no, c.model as crane_model, c.capacity as crane_capacity,
           s.site_name, s.client_name as party_name, s.site_code, s.site_incharge_name
    FROM crane_logbook l
    LEFT JOIN cranes c ON l.crane_number_id = c.id
    LEFT JOIN sites s ON l.site_id = s.id
    ${whereClause} 
    ORDER BY l.logbook_date ASC, l.id ASC
  `;

  const [rows] = await db.execute(query, params);
  return rows;
};

// 6. Get filtered list of all log entries (Register view)
exports.getAllLogEntries = async ({ crane_number_id, crane_reg_no, site_id, month, date_from, date_to, search, limit = 100, offset = 0 }) => {
  let conditions = [];
  let params = [];

  if (crane_number_id) {
    conditions.push("l.crane_number_id = ?");
    params.push(crane_number_id);
  } else if (crane_reg_no) {
    conditions.push("c.reg_no = ?");
    params.push(crane_reg_no);
  }

  if (site_id) {
    conditions.push("l.site_id = ?");
    params.push(site_id);
  }

  if (month) {
    conditions.push("l.month = ?");
    params.push(month);
  }

  if (date_from) {
    conditions.push("l.logbook_date >= ?");
    params.push(date_from);
  }

  if (date_to) {
    conditions.push("l.logbook_date <= ?");
    params.push(date_to);
  }

  if (search) {
    conditions.push("(s.client_name LIKE ? OR s.site_name LIKE ? OR c.reg_no LIKE ? OR l.operator_sign LIKE ? OR l.site_incharge_sign LIKE ? OR l.work_description LIKE ? OR l.remarks LIKE ?)");
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM crane_logbook l
    LEFT JOIN cranes c ON l.crane_number_id = c.id
    LEFT JOIN sites s ON l.site_id = s.id
    ${whereClause}
  `;
  const [countRows] = await db.execute(countQuery, params);
  const total = countRows[0]?.total || 0;

  const dataQuery = `
    SELECT l.*,
           c.reg_no as crane_reg_no, c.model as crane_model, c.capacity as crane_capacity,
           s.site_name, s.client_name as party_name, s.site_code, s.site_incharge_name
    FROM crane_logbook l
    LEFT JOIN cranes c ON l.crane_number_id = c.id
    LEFT JOIN sites s ON l.site_id = s.id
    ${whereClause} 
    ORDER BY l.logbook_date DESC, l.id DESC 
    LIMIT ? OFFSET ?
  `;
  const [rows] = await db.execute(dataQuery, [...params, Number(limit), Number(offset)]);

  return { total, rows };
};

// 7. Get Operator Active Assignment (for automatic 1-click prefill)
exports.getOperatorActiveAssignment = async (empId) => {
  // Check active gang assignment
  const [gangRows] = await db.execute(`
    SELECT g.*, c.reg_no as crane_reg_no, c.model as crane_model, s.id as site_id, s.site_name, s.client_name, s.site_incharge_name
    FROM crane_crew_assignments g
    JOIN cranes c ON g.crane_id = c.id
    JOIN sites s ON g.site_id = s.id
    WHERE (g.primary_operator_id = ? OR g.co_operator_id = ?) AND g.status = 'Active'
    ORDER BY g.id DESC
    LIMIT 1
  `, [empId, empId]);

  if (gangRows.length > 0) {
    const gang = gangRows[0];
    // Find latest meter readings for this crane to prefill next start readings
    const [latestLog] = await db.execute(`
      SELECT hours_end, kmh_end, logbook_date, site_incharge_sign, operator_sign
      FROM crane_logbook 
      WHERE crane_number_id = ? 
      ORDER BY logbook_date DESC, id DESC 
      LIMIT 1
    `, [gang.crane_id]);

    return {
      has_assignment: true,
      crane_number_id: gang.crane_id,
      crane_id: gang.crane_id,
      crane_reg_no: gang.crane_reg_no,
      crane_model: gang.crane_model,
      site_id: gang.site_id,
      site_name: gang.site_name,
      party_name: gang.client_name || gang.site_name,
      site_incharge_sign: gang.site_incharge_name || latestLog[0]?.site_incharge_sign || '',
      shift: gang.shift,
      last_hours_reading: latestLog[0]?.hours_end || null,
      last_kmh_reading: latestLog[0]?.kmh_end || null,
      last_log_date: latestLog[0]?.logbook_date || null
    };
  }

  // Fallback: check general site deployment
  const [depRows] = await db.execute(`
    SELECT d.*, s.site_name, s.client_name, s.site_incharge_name
    FROM site_deployments d
    JOIN sites s ON d.site_id = s.id
    WHERE d.resource_type = 'Operator' AND d.resource_id = ? AND d.status = 'Active'
    ORDER BY d.id DESC
    LIMIT 1
  `, [empId]);

  if (depRows.length > 0) {
    const dep = depRows[0];
    return {
      has_assignment: true,
      site_id: dep.site_id,
      site_name: dep.site_name,
      party_name: dep.client_name || dep.site_name,
      site_incharge_sign: dep.site_incharge_name || '',
      crane_number_id: null,
      crane_id: null,
      crane_reg_no: null
    };
  }

  return { has_assignment: false };
};

// 8. Get distinct list of Cranes, Months, and Sites for dropdowns
exports.getFilterOptions = async () => {
  const [cranes] = await db.execute("SELECT id, reg_no, model, capacity FROM cranes ORDER BY reg_no ASC");
  const [sites] = await db.execute("SELECT id, site_name, client_name, site_code, site_incharge_name FROM sites ORDER BY site_name ASC");
  const [months] = await db.execute("SELECT DISTINCT month FROM crane_logbook WHERE month IS NOT NULL AND month != '' ORDER BY id DESC");

  return {
    registered_cranes: cranes,
    sites: sites,
    logged_months: months.map(m => m.month)
  };
};

// 9. Get overall logbook summary stats
exports.getSummaryStats = async ({ month, crane_number_id, site_id }) => {
  let conditions = [];
  let params = [];

  if (month) {
    conditions.push("month = ?");
    params.push(month);
  }
  if (crane_number_id) {
    conditions.push("crane_number_id = ?");
    params.push(crane_number_id);
  }
  if (site_id) {
    conditions.push("site_id = ?");
    params.push(site_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [totalEntries] = await db.execute(`SELECT COUNT(*) as count FROM crane_logbook ${whereClause}`, params);
  const [activeCranes] = await db.execute(`SELECT COUNT(DISTINCT crane_number_id) as count FROM crane_logbook ${whereClause}`, params);
  const [activeSites] = await db.execute(`SELECT COUNT(DISTINCT site_id) as count FROM crane_logbook ${whereClause}`, params);
  const [summaryData] = await db.execute(`
    SELECT 
      SUM(CASE WHEN hours_end >= hours_start THEN (hours_end - hours_start) ELSE 0 END) as total_hours,
      SUM(CASE WHEN kmh_end >= kmh_start THEN (kmh_end - kmh_start) ELSE 0 END) as total_kmh
    FROM crane_logbook 
    ${whereClause}
  `, params);

  return {
    total_entries: totalEntries[0]?.count || 0,
    active_cranes_logged: activeCranes[0]?.count || 0,
    active_sites_logged: activeSites[0]?.count || 0,
    total_hours_worked: Number(summaryData[0]?.total_hours || 0).toFixed(2),
    total_kmh_run: Number(summaryData[0]?.total_kmh || 0).toFixed(2)
  };
};
