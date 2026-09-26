const authModel = require("../../models/auth/authModel.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper to verify DOB in multiple user-friendly formats
const verifyDobMatch = (inputPassword, storedDob) => {
  if (!inputPassword || !storedDob) return false;
  const d = new Date(storedDob);
  if (isNaN(d.getTime())) return false;

  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = yyyy.slice(-2);

  const cleanInput = inputPassword.trim().replace(/[\s\/\-\.]/g, '');
  const cleanYMD = `${yyyy}${mm}${dd}`;
  const cleanDMY = `${dd}${mm}${yyyy}`;
  const cleanDMY_short = `${dd}${mm}${yy}`;

  const validFormats = [
    `${yyyy}-${mm}-${dd}`,
    `${dd}-${mm}-${yyyy}`,
    `${dd}/${mm}/${yyyy}`,
    `${yyyy}/${mm}/${dd}`,
    cleanYMD,
    cleanDMY,
    cleanDMY_short
  ];

  return validFormats.includes(inputPassword.trim()) || 
         cleanInput === cleanYMD || 
         cleanInput === cleanDMY;
};

exports.register = async (req, res) => {
  const { user_id, name, password, role_id, created_by } = req.body;

  try {
    if (!user_id || !name || !password || !role_id) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const existing = await authModel.findUserById(user_id);
    if (existing.length > 0) {
      return res.status(409).json({ message: "User ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await authModel.createUser([
      user_id,
      name,
      hashedPassword,
      role_id,
      'Active',
      created_by || 'System'
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  const { user_id, password } = req.body;

  try {
    if (!user_id || !password) {
      return res.status(400).json({ message: "User ID and password are required" });
    }

    const trimmedUserId = user_id.trim();

    // 1. Check if user is in 'users' table (Admin / Supervisor / Management)
    const adminRows = await authModel.findUserById(trimmedUserId);
    if (adminRows.length > 0) {
      const user = adminRows[0];

      if (user.status !== 'Active') {
        return res.status(403).json({ message: `Account is ${user.status}` });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await authModel.updateLastLogin(user.user_id);

      const token = jwt.sign(
        { 
          id: user.user_id, 
          user_id: user.user_id, 
          name: user.name, 
          role: user.role_name || 'Admin' 
        },
        process.env.JWT_SECRET,
        { expiresIn: "2d" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          user_id: user.user_id,
          name: user.name,
          role: user.role_name || 'Admin'
        }
      });
    }

    // 2. Check if user is in 'employee_details' (Operators / Riggers)
    const empRows = await authModel.findEmployeeForLogin(trimmedUserId);
    if (empRows.length > 0) {
      const emp = empRows[0];

      if (emp.status && emp.status !== 'Active') {
        return res.status(403).json({ message: `Employee record is ${emp.status}` });
      }

      // Verify Password against DOB
      const isDobValid = verifyDobMatch(password, emp.dob);
      if (!isDobValid) {
        return res.status(401).json({ message: "Invalid credentials (Password must be your Date of Birth, e.g. YYYY-MM-DD or DD-MM-YYYY)" });
      }

      // Determine Role
      let role = 'Operator';
      const desig = (emp.designation || '').toLowerCase();
      if (desig.includes('rigger')) {
        role = 'Rigger';
      } else if (desig.includes('operator')) {
        role = 'Operator';
      } else if (desig.includes('supervisor')) {
        role = 'Supervisor';
      } else if (emp.designation) {
        role = emp.designation;
      }

      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.first_name;

      const token = jwt.sign(
        { 
          emp_id: emp.emp_id, 
          user_id: emp.first_name, 
          name: fullName, 
          role: role,
          designation: emp.designation,
          unit_name: emp.unit_name
        },
        process.env.JWT_SECRET,
        { expiresIn: "2d" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          emp_id: emp.emp_id,
          user_id: emp.first_name,
          name: fullName,
          role: role,
          designation: emp.designation || role,
          unit_name: emp.unit_name,
          photo: emp.photo
        }
      });
    }

    // If neither matches
    return res.status(404).json({ message: "User not found. Please check your Name or User ID." });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};