const db = require("../../config/db.js");

// Check if user exists in users table (Admin / Management)
exports.findUserById = async (user_id) => {
  const [rows] = await db.execute(
    `SELECT 
        u.user_id, 
        u.name, 
        u.password, 
        u.role_id, 
        u.status, 
        r.NAME as role_name 
     FROM users u 
     LEFT JOIN roles r ON u.role_id = r.id 
     WHERE LOWER(TRIM(u.user_id)) = LOWER(TRIM(?))`,
    [user_id]
  );
  return rows;
};

// Check if employee exists in employee_details (Operators / Riggers)
exports.findEmployeeForLogin = async (identifier) => {
  const trimmed = identifier.trim();
  const [rows] = await db.execute(
    `SELECT 
        emp_id, 
        first_name, 
        last_name, 
        dob, 
        designation, 
        unit_name, 
        contact_no, 
        email, 
        photo,
        status 
     FROM employee_details 
     WHERE LOWER(TRIM(first_name)) = LOWER(?) 
        OR LOWER(TRIM(CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,'')))) = LOWER(?)
        OR LOWER(TRIM(email)) = LOWER(?)
        OR TRIM(contact_no) = ?`,
    [trimmed, trimmed, trimmed, trimmed]
  );
  return rows;
};

// Insert new user
exports.createUser = async (userData) => {
  return db.execute(
    `INSERT INTO users 
     (user_id, name, password, role_id, status, created_by) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    userData
  );
};

// Update last login timestamp
exports.updateLastLogin = async (user_id) => {
  return db.execute(
    "UPDATE users SET last_login = current_timestamp() WHERE user_id = ?",
    [user_id]
  );
};