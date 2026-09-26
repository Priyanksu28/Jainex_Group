const assignmentModel = require("../../models/assignments/assignmentModel.js");

// 1. Get Global Assignment Overview
exports.getOverview = async (req, res) => {
  try {
    const data = await assignmentModel.getGlobalOverview();
    res.json(data);
  } catch (err) {
    console.error("Error in getOverview:", err);
    res.status(500).json({ error: err.message || "Failed to load assignment overview" });
  }
};

// 2. Get Available / Free Resource Pool
exports.getAvailablePool = async (req, res) => {
  try {
    const data = await assignmentModel.getAvailablePool();
    res.json(data);
  } catch (err) {
    console.error("Error in getAvailablePool:", err);
    res.status(500).json({ error: err.message || "Failed to fetch available pool" });
  }
};

// 3. Get Site Roster (Deployed resources & Crane Gangs)
exports.getSiteRoster = async (req, res) => {
  try {
    const { siteId } = req.params;
    const data = await assignmentModel.getSiteRoster(siteId);
    if (!data) {
      return res.status(404).json({ error: "Site not found" });
    }
    res.json(data);
  } catch (err) {
    console.error("Error in getSiteRoster:", err);
    res.status(500).json({ error: err.message || "Failed to fetch site roster" });
  }
};

// 4. Deploy Resource to Site (Tier 1)
exports.deployResource = async (req, res) => {
  try {
    const { site_id, resource_type, resource_id, start_date, end_date, remarks } = req.body;

    if (!site_id || !resource_type || !resource_id) {
      return res.status(400).json({ error: "Site, Resource Type, and Resource ID are required." });
    }

    const created_by = req.user?.name || req.user?.user_id || 'System';

    const insertId = await assignmentModel.deployResource({
      site_id: parseInt(site_id),
      resource_type,
      resource_id: parseInt(resource_id),
      start_date,
      end_date,
      remarks,
      created_by
    });

    res.status(201).json({
      message: `${resource_type} deployed to site successfully!`,
      deploymentId: insertId
    });
  } catch (err) {
    console.error("Error in deployResource:", err);
    res.status(400).json({ error: err.message || "Failed to deploy resource" });
  }
};

// 5. Create Crane Crew Gang (Tier 2: Link Crane <-> Operator <-> Riggers)
exports.createGang = async (req, res) => {
  try {
    const { site_id, crane_id, primary_operator_id, co_operator_id, rigger_ids, shift, assigned_date, notes } = req.body;

    if (!site_id || !crane_id || !primary_operator_id) {
      return res.status(400).json({ error: "Site, Crane, and Primary Operator are required to form a crew gang." });
    }

    const created_by = req.user?.name || req.user?.user_id || 'System';

    const gangId = await assignmentModel.createGang({
      site_id: parseInt(site_id),
      crane_id: parseInt(crane_id),
      primary_operator_id: parseInt(primary_operator_id),
      co_operator_id: co_operator_id ? parseInt(co_operator_id) : null,
      rigger_ids: Array.isArray(rigger_ids) ? rigger_ids.map(Number) : [],
      shift: shift || 'General',
      assigned_date,
      notes,
      created_by
    });

    res.status(201).json({
      message: "Crane Crew Gang created successfully!",
      gangId
    });
  } catch (err) {
    console.error("Error in createGang:", err);
    res.status(400).json({ error: err.message || "Failed to create crane crew gang" });
  }
};

// 6. Release Deployment (De-mobilize resource from site)
exports.releaseDeployment = async (req, res) => {
  try {
    const { id } = req.params;
    await assignmentModel.releaseDeployment(parseInt(id));
    res.json({ message: "Resource released from site successfully!" });
  } catch (err) {
    console.error("Error in releaseDeployment:", err);
    res.status(500).json({ error: err.message || "Failed to release resource" });
  }
};

// 7. Release Crane Gang
exports.releaseGang = async (req, res) => {
  try {
    const { id } = req.params;
    await assignmentModel.releaseGang(parseInt(id));
    res.json({ message: "Crane gang disbanded/released successfully!" });
  } catch (err) {
    console.error("Error in releaseGang:", err);
    res.status(500).json({ error: err.message || "Failed to release crane gang" });
  }
};

// 8. Transfer Resource to Another Site
exports.transferResource = async (req, res) => {
  try {
    const { deploymentId, newSiteId, transferDate, remarks } = req.body;

    if (!deploymentId || !newSiteId) {
      return res.status(400).json({ error: "Deployment ID and Target Site ID are required." });
    }

    const created_by = req.user?.name || req.user?.user_id || 'System';

    const newId = await assignmentModel.transferResource({
      deploymentId: parseInt(deploymentId),
      newSiteId: parseInt(newSiteId),
      transferDate,
      remarks,
      created_by
    });

    res.json({
      message: "Resource transferred to new site successfully!",
      newDeploymentId: newId
    });
  } catch (err) {
    console.error("Error in transferResource:", err);
    res.status(400).json({ error: err.message || "Failed to transfer resource" });
  }
};
