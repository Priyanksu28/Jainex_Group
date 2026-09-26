const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getRiggers, addRigger, getRiggerDetails } = require('../../controller/riggers/riggerController');
const { verifyToken, authorizeRoles } = require('../../middleware/authMiddleware');

// Setup storage for rigger photos
const uploadDir = path.join(__dirname, '../../uploads/riggers');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.get('/list', verifyToken, getRiggers);
router.get('/details/:id', verifyToken, getRiggerDetails);
router.post('/add', verifyToken, authorizeRoles('Admin'), upload.single('photo'), addRigger);

module.exports = router;
