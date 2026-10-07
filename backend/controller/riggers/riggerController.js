const riggerModel = require("../../models/riggers/riggerModel");

exports.getRiggers = async (req, res) => {
  try {
    const data = await riggerModel.getAllRiggers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addRigger = async (req, res) => {
  const { 
    first_name, 
    last_name, 
    father_husband_name,
    dob, 
    gender,
    marital_status,
    joining_date, 
    designation,
    unit_name,
    contact_no, 
    email, 
    permanent_address,
    present_address,
    aadhar_no,
    pan_no,
    pf_no,
    esic_no,
    uan_no,
    bank_name,
    bank_ifsc,
    bank_account_no,
    bank_address,
    family_members, // Array or JSON string
    nominees       // Array or JSON string
  } = req.body;

  try {
    if (!first_name || !last_name || !contact_no) {
      return res.status(400).json({ message: "First name, last name, and contact number are required" });
    }

    // Normalize designation to ensure it's categorized as a Rigger
    let finalDesignation = (designation || '').trim();
    if (!finalDesignation || !finalDesignation.toLowerCase().includes('rigger')) {
      finalDesignation = finalDesignation ? `${finalDesignation} (Rigger)` : 'Rigger';
    }

    const photoPath = req.file ? `/uploads/riggers/${req.file.filename}` : null;

    const empData = [
      first_name.trim(), 
      last_name.trim(), 
      father_husband_name || null,
      dob || null, 
      gender || null,
      marital_status || null,
      joining_date || null, 
      finalDesignation, 
      unit_name || null,
      contact_no.trim(), 
      email || null, 
      permanent_address || null,
      present_address || null,
      aadhar_no || null,
      pan_no || null,
      pf_no || null,
      esic_no || null,
      uan_no || null,
      bank_name || null,
      bank_ifsc || null,
      bank_account_no || null,
      bank_address || null,
      photoPath
    ];

    let familyData = family_members;
    if (typeof familyData === 'string') {
      try { familyData = JSON.parse(familyData); } catch (e) { familyData = []; }
    }

    let nomineeData = nominees;
    if (typeof nomineeData === 'string') {
      try { nomineeData = JSON.parse(nomineeData); } catch (e) { nomineeData = []; }
    }

    await riggerModel.createRigger(empData, familyData, nomineeData);

    res.status(201).json({ message: "Rigger registered successfully with declaration details" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getRiggerDetails = async (req, res) => {
  try {
    const data = await riggerModel.getRiggerById(req.params.id);
    if (!data.details) return res.status(404).json({ message: "Rigger not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRigger = async (req, res) => {
  try {
    await riggerModel.deleteRigger(req.params.id);
    res.json({ message: "Rigger deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
