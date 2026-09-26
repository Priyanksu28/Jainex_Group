const siteModel = require("../../models/sites/siteModel.js");

// Get next auto-generated site code
exports.getNextCode = async (req, res) => {
  try {
    const nextCode = await siteModel.getNextSiteCode();
    res.json({ nextCode });
  } catch (err) {
    console.error("Error generating next site code:", err);
    res.status(500).json({ error: "Failed to generate site code" });
  }
};

// Add a new site
exports.addSite = async (req, res) => {
  try {
    const {
      site_code,
      site_name,
      client_name,
      location,
      city,
      state,
      pincode,
      site_incharge_name,
      start_date,
      end_date,
      status
    } = req.body;

    if (!site_name || !site_name.trim()) {
      return res.status(400).json({ error: "Site Name is required." });
    }

    // Auto-generate site_code if not provided or empty
    let finalSiteCode = site_code ? site_code.trim() : '';
    if (!finalSiteCode) {
      finalSiteCode = await siteModel.getNextSiteCode();
    } else {
      const existing = await siteModel.getSiteByCode(finalSiteCode);
      if (existing) {
        return res.status(400).json({ error: `Site code '${finalSiteCode}' is already in use.` });
      }
    }

    const created_by = req.user?.name || req.user?.user_id || 'System';

    const insertId = await siteModel.createSite({
      site_code: finalSiteCode,
      site_name: site_name.trim(),
      client_name: client_name ? client_name.trim() : null,
      location: location ? location.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      pincode: pincode ? pincode.trim() : null,
      site_incharge_name: site_incharge_name ? site_incharge_name.trim() : null,
      start_date: start_date || null,
      end_date: end_date || null,
      status: status || 'Active',
      created_by
    });

    res.status(201).json({
      message: "Site created successfully",
      siteId: insertId
    });
  } catch (err) {
    console.error("Error creating site:", err);
    res.status(500).json({ error: err.message || "Failed to create site" });
  }
};

// Get all sites
exports.getSites = async (req, res) => {
  try {
    const data = await siteModel.getAllSites();
    res.json(data);
  } catch (err) {
    console.error("Error fetching sites:", err);
    res.status(500).json({ error: err.message || "Failed to fetch sites" });
  }
};

// Get single site by ID
exports.getSiteById = async (req, res) => {
  try {
    const { id } = req.params;
    const site = await siteModel.getSiteById(id);
    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }
    res.json(site);
  } catch (err) {
    console.error("Error fetching site details:", err);
    res.status(500).json({ error: err.message || "Failed to fetch site" });
  }
};

// Update site
exports.updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      site_code,
      site_name,
      client_name,
      location,
      city,
      state,
      pincode,
      site_incharge_name,
      start_date,
      end_date,
      status
    } = req.body;

    if (!site_name || !site_name.trim()) {
      return res.status(400).json({ error: "Site Name is required." });
    }

    if (site_code) {
      const existing = await siteModel.getSiteByCode(site_code.trim());
      if (existing && existing.id !== parseInt(id)) {
        return res.status(400).json({ error: `Site code '${site_code}' is already assigned to another site.` });
      }
    }

    await siteModel.updateSite(id, {
      site_code: site_code ? site_code.trim() : null,
      site_name: site_name.trim(),
      client_name: client_name ? client_name.trim() : null,
      location: location ? location.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      pincode: pincode ? pincode.trim() : null,
      site_incharge_name: site_incharge_name ? site_incharge_name.trim() : null,
      start_date: start_date || null,
      end_date: end_date || null,
      status: status || 'Active'
    });

    res.json({ message: "Site updated successfully" });
  } catch (err) {
    console.error("Error updating site:", err);
    res.status(500).json({ error: err.message || "Failed to update site" });
  }
};

// Update site status
exports.updateSiteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['Active', 'Completed', 'On Hold', 'Inactive'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    await siteModel.updateSiteStatus(id, status);
    res.json({ message: "Site status updated successfully", status });
  } catch (err) {
    console.error("Error updating site status:", err);
    res.status(500).json({ error: err.message || "Failed to update site status" });
  }
};

// Delete site
exports.deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    await siteModel.deleteSite(id);
    res.json({ message: "Site deleted successfully" });
  } catch (err) {
    console.error("Error deleting site:", err);
    res.status(500).json({ error: err.message || "Failed to delete site" });
  }
};
