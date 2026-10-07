const logbookModel = require("../../models/logbook/logbookModel.js");

// Helper to format Month Year string from Date e.g. "August 2026"
const formatMonthYearStr = (dateStr) => {
  if (!dateStr) {
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "August 2026";
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// 1. Create Logbook Entry
exports.createLogEntry = async (req, res) => {
  try {
    const {
      month,
      logbook_date,
      site_id,
      crane_number_id,
      start_time,
      end_time,
      hours_start,
      hours_end,
      kmh_start,
      kmh_end,
      work_description,
      site_incharge_sign,
      operator_sign,
      remarks
    } = req.body;

    if (!logbook_date || !site_id || !crane_number_id || !work_description) {
      return res.status(400).json({ 
        message: "Missing required fields: Date, Site, Crane, and Work Description are required." 
      });
    }

    const finalMonth = month || formatMonthYearStr(logbook_date);
    const finalOperatorSign = operator_sign || req.user.name || 'Operator';

    const insertId = await logbookModel.createLogEntry({
      month: finalMonth,
      logbook_date,
      site_id: parseInt(site_id, 10),
      crane_number_id: parseInt(crane_number_id, 10),
      start_time: start_time || null,
      end_time: end_time || null,
      hours_start: hours_start !== undefined && hours_start !== '' ? hours_start : null,
      hours_end: hours_end !== undefined && hours_end !== '' ? hours_end : null,
      kmh_start: kmh_start !== undefined && kmh_start !== '' ? kmh_start : null,
      kmh_end: kmh_end !== undefined && kmh_end !== '' ? kmh_end : null,
      work_description: work_description.trim(),
      site_incharge_sign: site_incharge_sign || null,
      operator_sign: finalOperatorSign,
      remarks: remarks || null
    });

    res.status(201).json({
      message: "Daily logbook entry recorded successfully!",
      id: insertId
    });
  } catch (err) {
    console.error("Error creating log entry:", err);
    res.status(500).json({ error: err.message || "Failed to create logbook entry." });
  }
};

// 2. Update Logbook Entry
exports.updateLogEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      month,
      logbook_date,
      site_id,
      crane_number_id,
      start_time,
      end_time,
      hours_start,
      hours_end,
      kmh_start,
      kmh_end,
      work_description,
      site_incharge_sign,
      operator_sign,
      remarks
    } = req.body;

    const existing = await logbookModel.getLogEntryById(id);
    if (!existing) {
      return res.status(404).json({ message: "Logbook entry not found." });
    }

    const finalDate = logbook_date || existing.logbook_date;
    const finalMonth = month || existing.month || formatMonthYearStr(finalDate);

    await logbookModel.updateLogEntry(id, {
      month: finalMonth,
      logbook_date: finalDate,
      site_id: site_id !== undefined ? parseInt(site_id, 10) : existing.site_id,
      crane_number_id: crane_number_id !== undefined ? parseInt(crane_number_id, 10) : existing.crane_number_id,
      start_time: start_time !== undefined ? start_time : existing.start_time,
      end_time: end_time !== undefined ? end_time : existing.end_time,
      hours_start: hours_start !== undefined ? (hours_start !== '' ? hours_start : null) : existing.hours_start,
      hours_end: hours_end !== undefined ? (hours_end !== '' ? hours_end : null) : existing.hours_end,
      kmh_start: kmh_start !== undefined ? (kmh_start !== '' ? kmh_start : null) : existing.kmh_start,
      kmh_end: kmh_end !== undefined ? (kmh_end !== '' ? kmh_end : null) : existing.kmh_end,
      work_description: work_description || existing.work_description,
      site_incharge_sign: site_incharge_sign !== undefined ? site_incharge_sign : existing.site_incharge_sign,
      operator_sign: operator_sign || existing.operator_sign,
      remarks: remarks !== undefined ? remarks : existing.remarks
    });

    res.status(200).json({ message: "Logbook entry updated successfully." });
  } catch (err) {
    console.error("Error updating log entry:", err);
    res.status(500).json({ error: err.message || "Failed to update log entry." });
  }
};

// 3. Delete Logbook Entry
exports.deleteLogEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await logbookModel.getLogEntryById(id);
    if (!existing) {
      return res.status(404).json({ message: "Logbook entry not found." });
    }

    await logbookModel.deleteLogEntry(id);
    res.status(200).json({ message: "Logbook entry deleted successfully." });
  } catch (err) {
    console.error("Error deleting log entry:", err);
    res.status(500).json({ error: err.message || "Failed to delete log entry." });
  }
};

// 4. Get Monthly Log Sheet (Physical Printable Format View)
exports.getMonthlySheet = async (req, res) => {
  try {
    const { crane_number_id, crane_reg_no, month, site_id } = req.query;

    const entries = await logbookModel.getMonthlySheet({
      crane_number_id: crane_number_id ? parseInt(crane_number_id, 10) : null,
      crane_reg_no: crane_reg_no || null,
      month: month || null,
      site_id: site_id ? parseInt(site_id, 10) : null
    });

    // Extract Header Information from records
    const firstEntry = entries[0] || {};
    const headerInfo = {
      company_name: "JAINEX PARIWAHAN PVT. LTD.",
      company_address: "Chatribari Road, Guwahati-1",
      month: month || firstEntry.month || formatMonthYearStr(),
      party_name: firstEntry.party_name || "N/A",
      site_name: firstEntry.site_name || null,
      crane_reg_no: firstEntry.crane_reg_no || crane_reg_no || "N/A",
      crane_model: firstEntry.crane_model || null,
      crane_number_id: firstEntry.crane_number_id || crane_number_id || null,
      site_id: firstEntry.site_id || site_id || null
    };

    // Calculate Summary Totals for the month
    let totalHoursWorked = 0;
    let totalKmhRun = 0;
    let minHourStart = null;
    let maxHourEnd = null;
    let minKmStart = null;
    let maxKmEnd = null;

    entries.forEach(e => {
      if (e.total_hours !== null && e.total_hours !== undefined) {
        totalHoursWorked += parseFloat(e.total_hours);
      }
      if (e.total_kmh !== null && e.total_kmh !== undefined) {
        totalKmhRun += parseFloat(e.total_kmh);
      }

      if (e.hours_start !== null && e.hours_start !== undefined) {
        const val = parseFloat(e.hours_start);
        if (minHourStart === null || val < minHourStart) minHourStart = val;
      }
      if (e.hours_end !== null && e.hours_end !== undefined) {
        const val = parseFloat(e.hours_end);
        if (maxHourEnd === null || val > maxHourEnd) maxHourEnd = val;
      }

      if (e.kmh_start !== null && e.kmh_start !== undefined) {
        const val = parseFloat(e.kmh_start);
        if (minKmStart === null || val < minKmStart) minKmStart = val;
      }
      if (e.kmh_end !== null && e.kmh_end !== undefined) {
        const val = parseFloat(e.kmh_end);
        if (maxKmEnd === null || val > maxKmEnd) maxKmEnd = val;
      }
    });

    res.status(200).json({
      header: headerInfo,
      entries,
      summary: {
        total_entries: entries.length,
        total_hours_worked: totalHoursWorked.toFixed(2),
        total_kmh_run: totalKmhRun.toFixed(2),
        initial_hours_reading: minHourStart,
        final_hours_reading: maxHourEnd,
        initial_kmh_reading: minKmStart,
        final_kmh_reading: maxKmEnd
      }
    });
  } catch (err) {
    console.error("Error getting monthly sheet:", err);
    res.status(500).json({ error: err.message || "Failed to load monthly sheet." });
  }
};

// 5. Get Filtered All Entries (Admin Table / List view)
exports.getAllLogEntries = async (req, res) => {
  try {
    const { crane_number_id, crane_reg_no, site_id, month, date_from, date_to, search, limit, offset } = req.query;

    const data = await logbookModel.getAllLogEntries({
      crane_number_id: crane_number_id ? parseInt(crane_number_id, 10) : null,
      crane_reg_no,
      site_id: site_id ? parseInt(site_id, 10) : null,
      month,
      date_from,
      date_to,
      search,
      limit: limit || 100,
      offset: offset || 0
    });

    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching all log entries:", err);
    res.status(500).json({ error: err.message || "Failed to fetch log entries." });
  }
};

// 6. Get Operator's Active Assignment for instant 1-click form pre-filling
exports.getOperatorActiveAssignment = async (req, res) => {
  try {
    const emp_id = req.user.emp_id;
    if (!emp_id) {
      return res.status(200).json({ has_assignment: false, message: "No employee ID attached." });
    }

    const assignment = await logbookModel.getOperatorActiveAssignment(emp_id);
    res.status(200).json(assignment);
  } catch (err) {
    console.error("Error fetching operator assignment:", err);
    res.status(500).json({ error: err.message || "Failed to fetch operator assignment." });
  }
};

// 7. Get Filter Options (Cranes, Months, Sites)
exports.getFilterOptions = async (req, res) => {
  try {
    const options = await logbookModel.getFilterOptions();
    res.status(200).json(options);
  } catch (err) {
    console.error("Error getting filter options:", err);
    res.status(500).json({ error: err.message });
  }
};

// 8. Get Stats Overview
exports.getSummaryStats = async (req, res) => {
  try {
    const { month, crane_number_id, site_id } = req.query;

    const stats = await logbookModel.getSummaryStats({
      month,
      crane_number_id: crane_number_id ? parseInt(crane_number_id, 10) : null,
      site_id: site_id ? parseInt(site_id, 10) : null
    });
    res.status(200).json(stats);
  } catch (err) {
    console.error("Error getting summary stats:", err);
    res.status(500).json({ error: err.message });
  }
};
