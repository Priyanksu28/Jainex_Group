const db = require("../../config/db.js");

exports.getAllCranes = async () => {
  const [rows] = await db.execute("SELECT * FROM cranes ORDER BY id DESC");
  return rows;
};

exports.createCrane = async (craneData) => {
  const query = `INSERT INTO cranes 
    (owner_name, reg_no, crane_type, engine_no, chassis_no, serial_no, model, mfg_year, capacity, crane_image, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  return db.execute(query, craneData);
};

exports.deleteCrane = async (id) => {
  return db.execute("DELETE FROM cranes WHERE id = ?", [id]);
};

exports.updateCraneStatus = async (id, status) => {
  return db.execute("UPDATE cranes SET status = ? WHERE id = ?", [status, id]);
};