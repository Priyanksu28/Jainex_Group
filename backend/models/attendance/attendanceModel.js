const db = require("../../config/db.js");

// Mark or update attendance for an employee on a specific date
exports.markAttendance = async ({ emp_id, date, status, check_in_time, check_out_time, notes }) => {
  const query = `
    INSERT INTO attendance (emp_id, date, status, check_in_time, check_out_time, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      check_in_time = COALESCE(VALUES(check_in_time), check_in_time),
      check_out_time = COALESCE(VALUES(check_out_time), check_out_time),
      notes = COALESCE(VALUES(notes), notes),
      updated_at = CURRENT_TIMESTAMP
  `;
  return db.execute(query, [
    emp_id,
    date,
    status || 'Present',
    check_in_time || null,
    check_out_time || null,
    notes || null
  ]);
};

// Check today's attendance status for an employee
exports.getTodayStatus = async (emp_id, date) => {
  const [rows] = await db.execute(
    "SELECT * FROM attendance WHERE emp_id = ? AND date = ?",
    [emp_id, date]
  );
  return rows[0] || null;
};

// Get monthly / overall history for a specific employee
exports.getEmployeeAttendanceHistory = async (emp_id, month, year) => {
  let query = `
    SELECT 
      a.*,
      e.first_name,
      e.last_name,
      e.designation,
      e.unit_name
    FROM attendance a
    JOIN employee_details e ON a.emp_id = e.emp_id
    WHERE a.emp_id = ?
  `;
  const params = [emp_id];

  if (month && year) {
    query += " AND MONTH(a.date) = ? AND YEAR(a.date) = ?";
    params.push(month, year);
  }

  query += " ORDER BY a.date DESC LIMIT 100";

  const [rows] = await db.execute(query, params);
  return rows;
};

// Get all employee attendance records (for Admin / Supervisor)
exports.getAllAttendance = async ({ date, month, year, role, search }) => {
  let query = `
    SELECT 
      a.id,
      a.emp_id,
      a.date,
      a.status,
      a.check_in_time,
      a.check_out_time,
      a.notes,
      a.created_at,
      e.first_name,
      e.last_name,
      e.designation,
      e.unit_name,
      e.contact_no,
      e.photo
    FROM attendance a
    JOIN employee_details e ON a.emp_id = e.emp_id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    query += " AND a.date = ?";
    params.push(date);
  } else if (month && year) {
    query += " AND MONTH(a.date) = ? AND YEAR(a.date) = ?";
    params.push(month, year);
  }

  if (role && role !== 'All') {
    query += " AND (LOWER(e.designation) LIKE LOWER(?) OR LOWER(?) = 'all')";
    params.push(`%${role}%`, role);
  }

  if (search) {
    const s = `%${search.trim()}%`;
    query += " AND (LOWER(e.first_name) LIKE LOWER(?) OR LOWER(e.last_name) LIKE LOWER(?) OR e.contact_no LIKE ?)";
    params.push(s, s, s);
  }

  query += " ORDER BY a.date DESC, a.id DESC LIMIT 500";

  const [rows] = await db.execute(query, params);
  return rows;
};

// Get monthly attendance summary stats for an employee
exports.getEmployeeStats = async (emp_id, month, year) => {
  const currentMonth = month || (new Date().getMonth() + 1);
  const currentYear = year || new Date().getFullYear();

  const [rows] = await db.execute(
    `SELECT 
      COUNT(*) as total_records,
      SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_days,
      SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) as leave_days,
      SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days
     FROM attendance 
     WHERE emp_id = ? AND MONTH(date) = ? AND YEAR(date) = ?`,
    [emp_id, currentMonth, currentYear]
  );

  return rows[0] || { total_records: 0, present_days: 0, half_days: 0, leave_days: 0, absent_days: 0 };
};

// Get overall stats for today (for Admin Dashboard)
exports.getTodayOverallStats = async (todayDate) => {
  const [totalActiveEmps] = await db.execute(
    "SELECT COUNT(*) as total FROM employee_details WHERE status = 'Active'"
  );
  const [attendanceToday] = await db.execute(
    `SELECT 
      COUNT(*) as marked_total,
      SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
      SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_day_count,
      SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) as leave_count,
      SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count
     FROM attendance WHERE date = ?`,
    [todayDate]
  );

  return {
    total_active_employees: totalActiveEmps[0]?.total || 0,
    attendance_marked: attendanceToday[0]?.marked_total || 0,
    present: attendanceToday[0]?.present_count || 0,
    half_day: attendanceToday[0]?.half_day_count || 0,
    leave: attendanceToday[0]?.leave_count || 0,
    absent: attendanceToday[0]?.absent_count || 0
  };
};
