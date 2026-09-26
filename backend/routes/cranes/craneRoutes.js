const express = require('express');
const router = express.Router();
// const craneController = require('../controllers/craneController');
const { verifyToken, authorizeRoles } = require('../../middleware/authMiddleware');
const multer = require('multer');
const { getCranes, addCrane, updateCraneStatus } = require('../../controller/cranes/cranseController');

// Setup storage for images
const storage = multer.diskStorage({
  destination: 'uploads/cranes/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ROUTES
// Only Admin can Add or Delete or Update Status
router.post('/add', verifyToken, authorizeRoles('Admin'), upload.single('crane_image'), addCrane);
router.get('/list', verifyToken, authorizeRoles('Admin'), getCranes); // All logged in users can view
router.patch('/status/:id', verifyToken, authorizeRoles('Admin'), updateCraneStatus);

module.exports = router;