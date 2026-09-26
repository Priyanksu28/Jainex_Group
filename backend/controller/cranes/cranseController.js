const craneModel = require("../../models/cranes/cranseModel.js");

exports.addCrane = async (req, res) => {
  try {
    const { owner_name, reg_no, crane_type, engine_no, chassis_no, serial_no, model, mfg_year, capacity } = req.body;
    
    // File path from multer (if image was uploaded)
    const crane_image = req.file ? `/uploads/cranes/${req.file.filename}` : null;
    const created_by = req.user.user_id; // From JWT middleware

    await craneModel.createCrane([
      owner_name, reg_no, crane_type, engine_no, chassis_no, 
      serial_no, model, mfg_year, capacity, crane_image, created_by
    ]);

    res.status(201).json({ message: "Crane added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCranes = async (req, res) => {
  try {
    const data = await craneModel.getAllCranes();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCraneStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['Working', 'Assigned', 'Maintenance', 'Inactive'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value. Allowed: " + allowedStatuses.join(', ') });
    }

    await craneModel.updateCraneStatus(id, status);
    res.json({ message: "Crane status updated successfully", status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};