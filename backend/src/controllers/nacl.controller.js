const sql = require('mssql');
const dbConfig = require('../config/db.config');

// GET /api/nacl - ดึงข้อมูลทั้งหมด
exports.getAllNaCl = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Gen_NaCl_MT');
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// POST /api/nacl - เพิ่มข้อมูลใหม่
exports.createNaCl = async (req, res) => {
  const { NaCl_CG_Water, NaCl_NaCl_Water } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input('NaCl_CG_Water', sql.Float, NaCl_CG_Water)
      .input('NaCl_NaCl_Water', sql.Float, NaCl_NaCl_Water)
      .query(
        'INSERT INTO Gen_NaCl_MT (NaCl_CG_Water, NaCl_NaCl_Water) VALUES (@NaCl_CG_Water, @NaCl_NaCl_Water)',
      );
    res.status(201).send({ message: 'NaCl record created successfully!' });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// PUT /api/nacl/:id - แก้ไขข้อมูล
exports.updateNaCl = async (req, res) => {
  const { id } = req.params;
  const { NaCl_CG_Water, NaCl_NaCl_Water } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('NaCl_CG_Water', sql.Float, NaCl_CG_Water)
      .input('NaCl_NaCl_Water', sql.Float, NaCl_NaCl_Water)
      .query(
        'UPDATE Gen_NaCl_MT SET NaCl_CG_Water = @NaCl_CG_Water, NaCl_NaCl_Water = @NaCl_NaCl_Water WHERE NaCl_id = @id',
      );
    res.status(200).send({ message: 'NaCl record updated successfully!' });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// DELETE /api/nacl/:id - ลบข้อมูล
exports.deleteNaCl = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Gen_NaCl_MT WHERE NaCl_id = @id');
    res.status(200).send({ message: 'NaCl record deleted successfully!' });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


exports.lookupNaClValue = async (req, res) => {
  const { cgWater } = req.params;

  // ตรวจสอบว่าค่าที่ส่งมาเป็นตัวเลขหรือไม่
  if (isNaN(parseFloat(cgWater))) {
    return res.status(400).send({ message: 'Invalid input: cgWater must be a number.' });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('cgWaterValue', sql.Float, parseFloat(cgWater))
      .query('SELECT NaCl_NaCl_Water FROM Gen_NaCl_MT WHERE NaCl_CG_Water = @cgWaterValue');

    if (result.recordset.length > 0) {
      // ถ้าเจอข้อมูล ส่งค่ากลับไป
      res.status(200).json(result.recordset[0]);
    } else {
      // ถ้าไม่เจอข้อมูล
      res.status(404).send({ message: 'Value not found in NaCl table.' });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
}; 