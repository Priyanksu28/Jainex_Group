const attendanceModel = require("../../models/attendance/attendanceModel.js");

const getTodayDateStr = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getCurrentTimeStr = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

// 1. Mark or update attendance (for logged-in Operator / Rigger or Admin on behalf)
exports.markAttendance = async (req, res) => {
  try {
    const { status, date, notes, check_in_time, check_out_time, emp_id: bodyEmpId } = req.body;
    
    // Determine emp_id: use logged-in user's emp_id if Operator/Rigger, or bodyEmpId if Admin
    const emp_id = req.user.emp_id || bodyEmpId;

    if (!emp_id) {
      return res.status(400).json({ message: "Employee ID is required to mark attendance." });
    }

    const attendanceDate = date || getTodayDateStr();
    const punchTime = check_in_time || getCurrentTimeStr();

    await attendanceModel.markAttendance({
      emp_id,
      date: attendanceDate,
      status: status || 'Present',
      check_in_time: punchTime,
      check_out_time: check_out_time || null,
      notes: notes || null
    });

    res.status(200).json({ 
      message: `Attendance marked as ${status || 'Present'} for ${attendanceDate}`,
      date: attendanceDate,
      status: status || 'Present',
      check_in_time: punchTime
    });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Get today's attendance status for logged-in employee
exports.getTodayStatus = async (req, res) => {
  try {
    const emp_id = req.user.emp_id;
    if (!emp_id) {
      return res.status(200).json({ isEmployee: false });
    }

    const todayDate = getTodayDateStr();
    const record = await attendanceModel.getTodayStatus(emp_id, todayDate);
    const stats = await attendanceModel.getEmployeeStats(emp_id);

    res.status(200).json({
      isEmployee: true,
      todayDate,
      record: record || null,
      isMarked: !!record,
      stats
    });
  } catch (err) {
    console.error("Error checking today's attendance status:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Get my attendance history (Operator / Rigger)
exports.getMyAttendance = async (req, res) => {
  try {
    const emp_id = req.user.emp_id;
    if (!emp_id) {
      return res.status(400).json({ message: "No employee ID associated with this account." });
    }

    const { month, year } = req.query;
    const history = await attendanceModel.getEmployeeAttendanceHistory(emp_id, month, year);
    const stats = await attendanceModel.getEmployeeStats(emp_id, month, year);

    res.status(200).json({
      history,
      stats
    });
  } catch (err) {
    console.error("Error fetching my attendance history:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. Get all attendance records (Admin / Supervisor)
exports.getAllAttendance = async (req, res) => {
  try {
    const { date, month, year, role, search } = req.query;
    const records = await attendanceModel.getAllAttendance({ date, month, year, role, search });
    const todayStats = await attendanceModel.getTodayOverallStats(date || getTodayDateStr());

    res.status(200).json({
      records,
      stats: todayStats
    });
  } catch (err) {
    console.error("Error fetching all attendance records:", err);
    res.status(500).json({ error: err.message });
  }
};

// 5. Overall attendance stats (for Dashboard)
exports.getDashboardStats = async (req, res) => {
  try {
    const todayDate = getTodayDateStr();
    if (req.user.emp_id) {
      // Operator / Rigger stats
      const todayRecord = await attendanceModel.getTodayStatus(req.user.emp_id, todayDate);
      const monthlyStats = await attendanceModel.getEmployeeStats(req.user.emp_id);
      return res.status(200).json({
        role: req.user.role,
        todayRecord,
        monthlyStats
      });
    } else {
      // Admin overall stats
      const overall = await attendanceModel.getTodayOverallStats(todayDate);
      return res.status(200).json({
        role: req.user.role || 'Admin',
        overall
      });
    }
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: err.message });
  }
};
