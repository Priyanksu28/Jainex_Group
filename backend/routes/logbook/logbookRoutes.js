const express = require('express');
const router = express.Router();
const logbookController = require('../../controller/logbook/logbookController.js');
const { verifyToken, authorizeRoles } = require('../../middleware/authMiddleware.js');

// All logbook endpoints require authentication & role authorization (Admin, Supervisor, Operator)
router.use(verifyToken);
router.use(authorizeRoles('Admin', 'Supervisor', 'Operator'));

// 1. Get operator's active assignment (1-click autofill)
router.get('/operator-assignment', logbookController.getOperatorActiveAssignment);

// 2. Get filter options (cranes, months, parties, sites)
router.get('/filter-options', logbookController.getFilterOptions);

// 3. Get monthly log sheet (exact physical table layout)
router.get('/monthly-sheet', logbookController.getMonthlySheet);

// 4. Get summary statistics
router.get('/summary-stats', logbookController.getSummaryStats);

// 5. Get all logbook entries (with pagination & filters)
router.get('/entries', logbookController.getAllLogEntries);

// 6. Create daily logbook entry
router.post('/', logbookController.createLogEntry);

// 7. Update logbook entry
router.put('/:id', logbookController.updateLogEntry);

// 8. Delete logbook entry
router.delete('/:id', logbookController.deleteLogEntry);

module.exports = router;
