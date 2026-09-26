const db = require("../../config/db.js");

// Get all sites ordered by ID desc
exports.getAllSites = async () => {
  const [rows] = await db.execute("SELECT * FROM sites ORDER BY id DESC");
  return rows;
};

// Get single site by ID
exports.getSiteById = async (id) => {
  const [rows] = await db.execute("SELECT * FROM sites WHERE id = ?", [id]);
  return rows[0] || null;
};

// Get site by site_code
exports.getSiteByCode = async (siteCode) => {
  const [rows] = await db.execute("SELECT * FROM sites WHERE site_code = ?", [siteCode]);
  return rows[0] || null;
};

// Auto-generate the next site code (e.g. SITE-001, SITE-002, etc.)
exports.getNextSiteCode = async () => {
  const [rows] = await db.execute(`
    SELECT site_code FROM sites 
    WHERE site_code LIKE 'SITE-%' 
    ORDER BY id DESC LIMIT 1
  `);

  let nextNum = 1;
  if (rows.length > 0 && rows[0].site_code) {
    const match = rows[0].site_code.match(/SITE-(\d+)/i);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  } else {
    const [countRows] = await db.execute("SELECT MAX(id) as maxId FROM sites");
    nextNum = (countRows[0]?.maxId || 0) + 1;
  }

  return `SITE-${String(nextNum).padStart(3, '0')}`;
};

// Create a new site
exports.createSite = async ({
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
  status,
  created_by
}) => {
  const query = `
    INSERT INTO sites 
      (site_code, site_name, client_name, location, city, state, pincode, 
       site_incharge_name, start_date, end_date, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [
    site_code || null,
    site_name,
    client_name || null,
    location || null,
    city || null,
    state || null,
    pincode || null,
    site_incharge_name || null,
    start_date || null,
    end_date || null,
    status || 'Active',
    created_by || null
  ]);
  return result.insertId;
};

// Update an existing site
exports.updateSite = async (id, {
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
}) => {
  const query = `
    UPDATE sites 
    SET site_code = ?,
        site_name = ?,
        client_name = ?,
        location = ?,
        city = ?,
        state = ?,
        pincode = ?,
        site_incharge_name = ?,
        start_date = ?,
        end_date = ?,
        status = ?
    WHERE id = ?
  `;
  return db.execute(query, [
    site_code || null,
    site_name,
    client_name || null,
    location || null,
    city || null,
    state || null,
    pincode || null,
    site_incharge_name || null,
    start_date || null,
    end_date || null,
    status || 'Active',
    id
  ]);
};

// Update site status
exports.updateSiteStatus = async (id, status) => {
  return db.execute("UPDATE sites SET status = ? WHERE id = ?", [status, id]);
};

// Delete a site
exports.deleteSite = async (id) => {
  return db.execute("DELETE FROM sites WHERE id = ?", [id]);
};
