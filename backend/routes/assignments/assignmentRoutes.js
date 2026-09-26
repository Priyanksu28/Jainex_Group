const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../../middleware/authMiddleware');
const {
  getOverview,
  getAvailablePool,
  getSiteRoster,
  deployResource,
  createGang,
  releaseDeployment,
  releaseGang,
  transferResource
} = require('../../controller/assignments/assignmentController');

// All authenticated users can view overview and rosters
router.get('/overview', verifyToken, getOverview);
router.get('/available-pool', verifyToken, getAvailablePool);
router.get('/site/:siteId/roster', verifyToken, getSiteRoster);

// Admin & Supervisor can deploy, form gangs, transfer, or release
router.post('/deploy', verifyToken, authorizeRoles('Admin', 'Supervisor'), deployResource);
router.post('/pair-gang', verifyToken, authorizeRoles('Admin', 'Supervisor'), createGang);
router.post('/transfer', verifyToken, authorizeRoles('Admin', 'Supervisor'), transferResource);
router.patch('/release-deployment/:id', verifyToken, authorizeRoles('Admin', 'Supervisor'), releaseDeployment);
router.patch('/release-gang/:id', verifyToken, authorizeRoles('Admin', 'Supervisor'), releaseGang);

module.exports = router;
