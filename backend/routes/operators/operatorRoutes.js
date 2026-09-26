const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getOperators, addOperator, getOperatorDetails } = require('../../controller/operators/operatorController');
const { verifyToken, authorizeRoles } = require('../../middleware/authMiddleware');

// Setup storage for operator photos
const uploadDir = path.join(__dirname, '../../uploads/operators');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/list', verifyToken, getOperators);
router.get('/details/:id', verifyToken, getOperatorDetails);
router.post('/add', verifyToken, authorizeRoles('Admin'), upload.single('photo'), addOperator);

module.exports = router;