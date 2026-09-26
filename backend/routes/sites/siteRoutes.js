const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../../middleware/authMiddleware');
const {
  addSite,
  getSites,
  getNextCode,
  getSiteById,
  updateSite,
  updateSiteStatus,
  deleteSite
} = require('../../controller/sites/siteController');

// Routes
// Admin & Supervisor can Add, View, and Update Sites
router.post('/add', verifyToken, authorizeRoles('Admin', 'Supervisor'), addSite);
router.get('/next-code', verifyToken, getNextCode);
router.get('/list', verifyToken, getSites);
router.get('/:id', verifyToken, getSiteById);
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Supervisor'), updateSite);
router.patch('/status/:id', verifyToken, authorizeRoles('Admin', 'Supervisor'), updateSiteStatus);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), deleteSite);

module.exports = router;
