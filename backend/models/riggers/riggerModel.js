const db = require("../../config/db.js");

// Get all riggers with complete family and nominee details
exports.getAllRiggers = async () => {
  const [riggers] = await db.execute(
    `SELECT * 
     FROM employee_details 
     WHERE LOWER(designation) LIKE '%rigger%' 
     ORDER BY emp_id DESC`
  );

  if (riggers.length === 0) return [];

  const empIds = riggers.map(r => r.emp_id);
  const placeholders = empIds.map(() => '?').join(',');

  const [familyMembers] = await db.execute(
    `SELECT * FROM family_members WHERE emp_id IN (${placeholders})`,
    empIds
  );

  const [nominees] = await db.execute(
    `SELECT * FROM nominees WHERE emp_id IN (${placeholders})`,
    empIds
  );

  return riggers.map(r => ({
    ...r,
    family_members: familyMembers.filter(f => f.emp_id === r.emp_id),
    nominees: nominees.filter(n => n.emp_id === r.emp_id)
  }));
};

// Get single rigger with family and nominee details
exports.getRiggerById = async (empId) => {
  const [details] = await db.execute("SELECT * FROM employee_details WHERE emp_id = ?", [empId]);
  const [family] = await db.execute("SELECT * FROM family_members WHERE emp_id = ?", [empId]);
  const [nominees] = await db.execute("SELECT * FROM nominees WHERE emp_id = ?", [empId]);
  
  return {
    details: details[0],
    family,
    nominees
  };
};

// Create Rigger using a Transaction
exports.createRigger = async (empData, familyData, nomineeData) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert into employee_details
    const [empResult] = await connection.execute(
      `INSERT INTO employee_details 
      (first_name, last_name, father_husband_name, dob, gender, marital_status, 
       joining_date, designation, unit_name, contact_no, email, 
       permanent_address, present_address, 
       aadhar_no, pan_no, pf_no, esic_no, uan_no, 
       bank_name, bank_ifsc, bank_account_no, bank_address, photo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      empData
    );

    const empId = empResult.insertId;

    // 2. Insert into family_members (Multiple rows)
    if (familyData && familyData.length > 0) {
      for (let member of familyData) {
        await connection.execute(
          `INSERT INTO family_members (emp_id, member_name, relationship, dob, aadhar_card_no) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            empId, 
            member.member_name || '', 
            member.relationship || '', 
            member.dob || null, 
            member.aadhar_card_no || null
          ]
        );
      }
    }

    // 3. Insert into nominees
    if (nomineeData && nomineeData.length > 0) {
      for (let nominee of nomineeData) {
        await connection.execute(
          `INSERT INTO nominees (emp_id, nominee_name, age, relationship, nominee_address) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            empId, 
            nominee.nominee_name || '', 
            nominee.age ? parseInt(nominee.age) : null, 
            nominee.relationship || '', 
            nominee.nominee_address || null
          ]
        );
      }
    }

    await connection.commit();
    return empId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.deleteRigger = async (empId) => {
  return db.execute("DELETE FROM employee_details WHERE emp_id = ?", [empId]);
};
