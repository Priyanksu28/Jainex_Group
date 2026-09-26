const db = require("../../config/db.js");

// Initialize tables if they don't exist
const initTables = async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`site_deployments\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`site_id\` INT NOT NULL,
        \`resource_type\` ENUM('Crane', 'Operator', 'Rigger') NOT NULL,
        \`resource_id\` INT NOT NULL COMMENT 'crane.id or employee_details.emp_id',
        \`start_date\` DATE NOT NULL,
        \`end_date\` DATE NULL,
        \`status\` ENUM('Active', 'Released', 'Transferred') DEFAULT 'Active',
        \`remarks\` TEXT NULL,
        \`created_by\` VARCHAR(100) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (\`site_id\`),
        INDEX (\`resource_type\`, \`resource_id\`),
        INDEX (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`crane_crew_assignments\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`site_id\` INT NOT NULL,
        \`crane_id\` INT NOT NULL,
        \`primary_operator_id\` INT NOT NULL COMMENT 'emp_id of Operator',
        \`co_operator_id\` INT NULL COMMENT 'emp_id of 2nd Shift/Reliever Operator',
        \`rigger_ids\` JSON NULL COMMENT 'Array of rigger emp_ids e.g. [12, 15]',
        \`shift\` ENUM('Day', 'Night', '24 Hours', 'General') DEFAULT 'General',
        \`assigned_date\` DATE NOT NULL,
        \`status\` ENUM('Active', 'Completed', 'Replaced') DEFAULT 'Active',
        \`notes\` VARCHAR(255) NULL,
        \`created_by\` VARCHAR(100) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (\`site_id\`),
        INDEX (\`crane_id\`),
        INDEX (\`primary_operator_id\`),
        INDEX (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.error("Error initializing assignment tables:", err);
  }
};

// Run table creation on startup
initTables();

// Global Stats Overview
exports.getGlobalOverview = async () => {
  const [totalDeployedCranes] = await db.execute(`
    SELECT COUNT(DISTINCT resource_id) as count 
    FROM site_deployments 
    WHERE resource_type = 'Crane' AND status = 'Active'
  `);

  const [totalDeployedOperators] = await db.execute(`
    SELECT COUNT(DISTINCT resource_id) as count 
    FROM site_deployments 
    WHERE resource_type = 'Operator' AND status = 'Active'
  `);

  const [totalDeployedRiggers] = await db.execute(`
    SELECT COUNT(DISTINCT resource_id) as count 
    FROM site_deployments 
    WHERE resource_type = 'Rigger' AND status = 'Active'
  `);

  const [activeGangs] = await db.execute(`
    SELECT COUNT(*) as count 
    FROM crane_crew_assignments 
    WHERE status = 'Active'
  `);

  const [sitesWithDeployments] = await db.execute(`
    SELECT COUNT(DISTINCT site_id) as count 
    FROM site_deployments 
    WHERE status = 'Active'
  `);

  return {
    deployed_cranes: totalDeployedCranes[0]?.count || 0,
    deployed_operators: totalDeployedOperators[0]?.count || 0,
    deployed_riggers: totalDeployedRiggers[0]?.count || 0,
    active_gangs: activeGangs[0]?.count || 0,
    active_sites_count: sitesWithDeployments[0]?.count || 0
  };
};

// Get Available / Free Resources in Pool (Not deployed to any site currently)
exports.getAvailablePool = async () => {
  // Free Cranes
  const [freeCranes] = await db.execute(`
    SELECT c.* 
    FROM cranes c
    WHERE c.id NOT IN (
      SELECT resource_id 
      FROM site_deployments 
      WHERE resource_type = 'Crane' AND status = 'Active'
    )
    ORDER BY c.model ASC
  `);

  // Free Operators
  const [freeOperators] = await db.execute(`
    SELECT e.emp_id, e.first_name, e.last_name, e.designation, e.contact_no, e.photo, e.unit_name
    FROM employee_details e
    WHERE LOWER(e.designation) = 'operator'
      AND e.emp_id NOT IN (
        SELECT resource_id 
        FROM site_deployments 
        WHERE resource_type = 'Operator' AND status = 'Active'
      )
    ORDER BY e.first_name ASC
  `);

  // Free Riggers
  const [freeRiggers] = await db.execute(`
    SELECT e.emp_id, e.first_name, e.last_name, e.designation, e.contact_no, e.photo, e.unit_name
    FROM employee_details e
    WHERE LOWER(e.designation) = 'rigger'
      AND e.emp_id NOT IN (
        SELECT resource_id 
        FROM site_deployments 
        WHERE resource_type = 'Rigger' AND status = 'Active'
      )
    ORDER BY e.first_name ASC
  `);

  return {
    cranes: freeCranes,
    operators: freeOperators,
    riggers: freeRiggers
  };
};

// Get Full Site Roster (All resources deployed to this site + Active Crane Gangs)
exports.getSiteRoster = async (siteId) => {
  // 1. Get Site Info
  const [siteRows] = await db.execute("SELECT * FROM sites WHERE id = ?", [siteId]);
  const site = siteRows[0] || null;
  if (!site) return null;

  // 2. Get Active Deployments at this site
  const [deployments] = await db.execute(`
    SELECT d.*,
      CASE 
        WHEN d.resource_type = 'Crane' THEN c.reg_no
        ELSE CONCAT(e.first_name, ' ', COALESCE(e.last_name, ''))
      END as resource_name,
      CASE 
        WHEN d.resource_type = 'Crane' THEN c.model
        ELSE e.designation
      END as resource_subtitle,
      c.capacity,
      c.crane_image,
      c.crane_type,
      e.contact_no,
      e.photo as employee_photo
    FROM site_deployments d
    LEFT JOIN cranes c ON d.resource_type = 'Crane' AND d.resource_id = c.id
    LEFT JOIN employee_details e ON (d.resource_type IN ('Operator', 'Rigger')) AND d.resource_id = e.emp_id
    WHERE d.site_id = ? AND d.status = 'Active'
    ORDER BY d.id DESC
  `, [siteId]);

  // 3. Get Active Crane Crew Gangs at this site
  const [gangs] = await db.execute(`
    SELECT 
      g.*,
      c.reg_no as crane_reg_no,
      c.model as crane_model,
      c.capacity as crane_capacity,
      c.crane_type,
      c.crane_image,
      op.first_name as op_first_name,
      op.last_name as op_last_name,
      op.contact_no as op_contact_no,
      op.photo as op_photo,
      co_op.first_name as coop_first_name,
      co_op.last_name as coop_last_name,
      co_op.contact_no as coop_contact_no
    FROM crane_crew_assignments g
    JOIN cranes c ON g.crane_id = c.id
    JOIN employee_details op ON g.primary_operator_id = op.emp_id
    LEFT JOIN employee_details co_op ON g.co_operator_id = co_op.emp_id
    WHERE g.site_id = ? AND g.status = 'Active'
    ORDER BY g.id DESC
  `, [siteId]);

  // Fetch all riggers details for the gangs
  const allRiggerIds = [];
  gangs.forEach(g => {
    let ids = [];
    try {
      ids = typeof g.rigger_ids === 'string' ? JSON.parse(g.rigger_ids) : (g.rigger_ids || []);
    } catch {
      ids = [];
    }
    if (Array.isArray(ids)) {
      ids.forEach(id => { if (id && !allRiggerIds.includes(id)) allRiggerIds.push(id); });
    }
  });

  let riggerMap = {};
  if (allRiggerIds.length > 0) {
    const placeholders = allRiggerIds.map(() => '?').join(',');
    const [riggerRows] = await db.execute(
      `SELECT emp_id, first_name, last_name, contact_no, photo FROM employee_details WHERE emp_id IN (${placeholders})`,
      allRiggerIds
    );
    riggerRows.forEach(r => {
      riggerMap[r.emp_id] = r;
    });
  }

  // Attach full rigger objects to each gang
  const gangsWithRiggers = gangs.map(g => {
    let ids = [];
    try {
      ids = typeof g.rigger_ids === 'string' ? JSON.parse(g.rigger_ids) : (g.rigger_ids || []);
    } catch {
      ids = [];
    }
    return {
      ...g,
      riggers: (Array.isArray(ids) ? ids : []).map(id => riggerMap[id]).filter(Boolean)
    };
  });

  // Calculate assigned vs unassigned sets
  const assignedCraneIds = new Set(gangs.map(g => g.crane_id));
  const assignedOperatorIds = new Set();
  const assignedRiggerIds = new Set();

  gangs.forEach(g => {
    if (g.primary_operator_id) assignedOperatorIds.add(g.primary_operator_id);
    if (g.co_operator_id) assignedOperatorIds.add(g.co_operator_id);
    let ids = [];
    try {
      ids = typeof g.rigger_ids === 'string' ? JSON.parse(g.rigger_ids) : (g.rigger_ids || []);
    } catch {
      ids = [];
    }
    if (Array.isArray(ids)) ids.forEach(id => assignedRiggerIds.add(id));
  });

  const cranesAtSite = deployments.filter(d => d.resource_type === 'Crane').map(d => ({
    ...d,
    is_assigned_to_gang: assignedCraneIds.has(d.resource_id)
  }));

  const operatorsAtSite = deployments.filter(d => d.resource_type === 'Operator').map(d => ({
    ...d,
    is_assigned_to_gang: assignedOperatorIds.has(d.resource_id)
  }));

  const riggersAtSite = deployments.filter(d => d.resource_type === 'Rigger').map(d => ({
    ...d,
    is_assigned_to_gang: assignedRiggerIds.has(d.resource_id)
  }));

  return {
    site,
    deployments,
    cranesAtSite,
    operatorsAtSite,
    riggersAtSite,
    gangs: gangsWithRiggers,
    summary: {
      total_cranes: cranesAtSite.length,
      working_cranes: cranesAtSite.filter(c => c.is_assigned_to_gang).length,
      idle_cranes: cranesAtSite.filter(c => !c.is_assigned_to_gang).length,
      total_operators: operatorsAtSite.length,
      working_operators: operatorsAtSite.filter(o => o.is_assigned_to_gang).length,
      free_operators: operatorsAtSite.filter(o => !o.is_assigned_to_gang).length,
      total_riggers: riggersAtSite.length,
      working_riggers: riggersAtSite.filter(r => r.is_assigned_to_gang).length,
      free_riggers: riggersAtSite.filter(r => !r.is_assigned_to_gang).length,
      total_gangs: gangsWithRiggers.length
    }
  };
};

// Check if a resource is currently deployed
exports.checkResourceDeployment = async (resourceType, resourceId) => {
  const [rows] = await db.execute(`
    SELECT d.*, s.site_name, s.site_code 
    FROM site_deployments d
    JOIN sites s ON d.site_id = s.id
    WHERE d.resource_type = ? AND d.resource_id = ? AND d.status = 'Active'
    LIMIT 1
  `, [resourceType, resourceId]);
  return rows[0] || null;
};

// Deploy Resource to Site (Tier 1)
exports.deployResource = async ({ site_id, resource_type, resource_id, start_date, end_date, remarks, created_by }) => {
  // Check if already actively deployed
  const existing = await exports.checkResourceDeployment(resource_type, resource_id);
  if (existing) {
    throw new Error(`${resource_type} is already actively deployed to Site "${existing.site_name}" (${existing.site_code || ''}).`);
  }

  const query = `
    INSERT INTO site_deployments 
      (site_id, resource_type, resource_id, start_date, end_date, remarks, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
  `;
  const [result] = await db.execute(query, [
    site_id,
    resource_type,
    resource_id,
    start_date || new Date().toISOString().slice(0, 10),
    end_date || null,
    remarks || null,
    created_by || null
  ]);

  // If crane, update status in cranes table
  if (resource_type === 'Crane') {
    await db.execute("UPDATE cranes SET status = 'Working' WHERE id = ?", [resource_id]);
  }

  return result.insertId;
};

// Create Crane Crew Gang Pairing (Tier 2)
exports.createGang = async ({ site_id, crane_id, primary_operator_id, co_operator_id, rigger_ids, shift, assigned_date, notes, created_by }) => {
  // Ensure crane is deployed at this site
  const craneDeployed = await exports.checkResourceDeployment('Crane', crane_id);
  if (!craneDeployed || craneDeployed.site_id !== parseInt(site_id)) {
    throw new Error("Selected Crane is not deployed at this site.");
  }

  // Ensure operator is deployed at this site
  const opDeployed = await exports.checkResourceDeployment('Operator', primary_operator_id);
  if (!opDeployed || opDeployed.site_id !== parseInt(site_id)) {
    throw new Error("Selected Operator is not deployed at this site.");
  }

  // Check if crane already has an active gang
  const [existingCraneGang] = await db.execute(`
    SELECT * FROM crane_crew_assignments 
    WHERE crane_id = ? AND status = 'Active'
    LIMIT 1
  `, [crane_id]);

  if (existingCraneGang.length > 0) {
    // Mark previous gang completed
    await db.execute("UPDATE crane_crew_assignments SET status = 'Replaced' WHERE id = ?", [existingCraneGang[0].id]);
  }

  const query = `
    INSERT INTO crane_crew_assignments 
      (site_id, crane_id, primary_operator_id, co_operator_id, rigger_ids, shift, assigned_date, notes, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  `;

  const [result] = await db.execute(query, [
    site_id,
    crane_id,
    primary_operator_id,
    co_operator_id || null,
    JSON.stringify(rigger_ids || []),
    shift || 'General',
    assigned_date || new Date().toISOString().slice(0, 10),
    notes || null,
    created_by || null
  ]);

  return result.insertId;
};

// Release a single deployment
exports.releaseDeployment = async (deploymentId) => {
  const [rows] = await db.execute("SELECT * FROM site_deployments WHERE id = ?", [deploymentId]);
  const dep = rows[0];
  if (!dep) throw new Error("Deployment record not found");

  const today = new Date().toISOString().slice(0, 10);
  await db.execute("UPDATE site_deployments SET status = 'Released', end_date = ? WHERE id = ?", [today, deploymentId]);

  // If crane, release its active gang and mark crane inactive or working
  if (dep.resource_type === 'Crane') {
    await db.execute("UPDATE crane_crew_assignments SET status = 'Completed' WHERE crane_id = ? AND status = 'Active'", [dep.resource_id]);
    await db.execute("UPDATE cranes SET status = 'Inactive' WHERE id = ?", [dep.resource_id]);
  }

  return true;
};

// Release an active crane crew gang
exports.releaseGang = async (gangId) => {
  return db.execute("UPDATE crane_crew_assignments SET status = 'Completed' WHERE id = ?", [gangId]);
};

// Transfer a resource to a new site
exports.transferResource = async ({ deploymentId, newSiteId, transferDate, remarks, created_by }) => {
  const [rows] = await db.execute("SELECT * FROM site_deployments WHERE id = ?", [deploymentId]);
  const dep = rows[0];
  if (!dep) throw new Error("Deployment not found");

  const effectiveDate = transferDate || new Date().toISOString().slice(0, 10);

  // 1. Mark previous deployment as Transferred
  await db.execute("UPDATE site_deployments SET status = 'Transferred', end_date = ? WHERE id = ?", [effectiveDate, deploymentId]);

  // 2. If it was a Crane, complete any active gang in old site
  if (dep.resource_type === 'Crane') {
    await db.execute("UPDATE crane_crew_assignments SET status = 'Completed' WHERE crane_id = ? AND status = 'Active'", [dep.resource_id]);
  }

  // 3. Create new deployment record in new site
  const query = `
    INSERT INTO site_deployments 
      (site_id, resource_type, resource_id, start_date, end_date, remarks, created_by, status)
    VALUES (?, ?, ?, ?, NULL, ?, ?, 'Active')
  `;
  const [res] = await db.execute(query, [
    newSiteId,
    dep.resource_type,
    dep.resource_id,
    effectiveDate,
    remarks ? `Transferred from Site #${dep.site_id}. ${remarks}` : `Transferred from Site #${dep.site_id}`,
    created_by || null
  ]);

  return res.insertId;
};
