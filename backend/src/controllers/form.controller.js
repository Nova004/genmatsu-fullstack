// backend/src/controllers/form.controller.js
const { pool, sql, poolConnect } = require('../db.js');

const getFormTemplateById = async (req, res) => {
  try {
    // === บรรทัดสำคัญที่เพิ่มเข้ามา ===
    // รอให้การเชื่อมต่อฐานข้อมูลเสร็จสมบูรณ์ก่อนเสมอ
    await poolConnect;

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM agt_FormTemplates_Gen WHERE Id = @id');

    if (result.recordset.length > 0) {
      const template = result.recordset[0];
      template.StructureDefinition = JSON.parse(template.StructureDefinition);
      res.json(template);
    } else {
      res.status(404).json({ message: 'Form template not found' });
    }
  } catch (error) {
    console.error("Error in getFormTemplateById:", error);
    res.status(500).send(error.message);
  }
};

module.exports = {
  getFormTemplateById,
};