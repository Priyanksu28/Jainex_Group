const express = require('express');
const router = express.Router();
const { 
  markAttendance, 
  getTodayStatus, 
  getMyAttendance, 
  getAllAttendance,
  getDashboardStats 
} = require('../../controller/attendance/attendanceController');
const { verifyToken, authorizeRoles } = require('../../middleware/authMiddleware');

// Logged-in user routes (Operators, Riggers, Admins)
router.post('/mark', verifyToken, markAttendance);
router.get('/today-status', verifyToken, getTodayStatus);
router.get('/my-history', verifyToken, getMyAttendance);
router.get('/dashboard-stats', verifyToken, getDashboardStats);

// Admin / Supervisor routes
router.get('/all', verifyToken, authorizeRoles('Admin', 'Supervisor'), getAllAttendance);

module.exports = router;
