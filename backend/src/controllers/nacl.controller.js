// src/controllers/nacl.controller.js
const sql = require("mssql");
const dbConfig = require("../config/db.config");
const activityLogRepository = require("../repositories/activityLog.repository");
const { getObjectDiff } = require("../utils/diffHelper");

// GET /api/nacl - ดึงข้อมูลทั้งหมด
exports.getAllNaCl = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM Gen_NaCl_MT");
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
      .input("NaCl_CG_Water", sql.Float, NaCl_CG_Water)
      .input("NaCl_NaCl_Water", sql.Float, NaCl_NaCl_Water)
      .query(
        "INSERT INTO Gen_NaCl_MT (NaCl_CG_Water, NaCl_NaCl_Water) VALUES (@NaCl_CG_Water, @NaCl_NaCl_Water)"
      );
    res.status(201).send({ message: "NaCl record created successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// PUT /api/nacl/:id - แก้ไขข้อมูล
exports.updateNaCl = async (req, res) => {
  const { id } = req.params;
  const { NaCl_CG_Water, NaCl_NaCl_Water, userId } = req.body; // Added userId
  try {
    const pool = await sql.connect(dbConfig);

    // --- 🔍 Fetch OLD Data for Diff Log ---
    const oldDataRequest = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Gen_NaCl_MT WHERE NaCl_id = @id");
    const oldData = oldDataRequest.recordset.length > 0 ? oldDataRequest.recordset[0] : null;

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("NaCl_CG_Water", sql.Float, NaCl_CG_Water)
      .input("NaCl_NaCl_Water", sql.Float, NaCl_NaCl_Water)
      .query(
        "UPDATE Gen_NaCl_MT SET NaCl_CG_Water = @NaCl_CG_Water, NaCl_NaCl_Water = @NaCl_NaCl_Water WHERE NaCl_id = @id"
      );

    // --- 📝 LOGGING ---
    try {
      const newData = { NaCl_CG_Water, NaCl_NaCl_Water };
      // We only compare the fields we changed
      const relevantOldData = {
        NaCl_CG_Water: oldData ? oldData.NaCl_CG_Water : undefined,
        NaCl_NaCl_Water: oldData ? oldData.NaCl_NaCl_Water : undefined
      };

      const differences = getObjectDiff(relevantOldData, newData);

      if (differences.length > 0) {
        await activityLogRepository.createLog({
          userId: userId || "Unknown",
          actionType: "UPDATE_NACL_MASTER",
          targetModule: "MASTER_NACL",
          targetId: id.toString(),
          details: {
            type: 'DIFF',
            message: `Updated NaCl Formula ID ${id}`,
            summary: `Updated NaCl Formula ID ${id}`,
            oldData: relevantOldData,
            newData: newData,
            changes: differences
          }
        });
      }
    } catch (logErr) {
      console.error("Failed to log NaCl update:", logErr);
    }

    res.status(200).send({ message: "NaCl record updated successfully!" });
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
      .input("id", sql.Int, id)
      .query("DELETE FROM Gen_NaCl_MT WHERE NaCl_id = @id");
    res.status(200).send({ message: "NaCl record deleted successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.lookupNaClValue = async (req, res) => {
  // 1. ดึงค่าทั้งหมดออกจาก URL Parameters
  // รูปแบบ URL: /api/nacl/lookup/:cgWater/:naclType/:chemicalsType
  const { cgWater, naclType, chemicalsType } = req.params;

  // --- การจัดการและตรวจสอบ Input ---

  // ตรวจสอบ cgWater และ naclType (เหมือนเดิม)
  if (isNaN(parseFloat(cgWater))) {
    return res
      .status(400)
      .send({ message: "Invalid input: cgWater must be a number." });
  }
  if (!naclType || typeof naclType !== "string") {
    return res
      .status(400)
      .send({ message: "Invalid input: naclType is required." });
  }

  // 2. จัดการค่า Chemicals_Type ที่เป็น Optional
  // ถ้า Front-end ส่ง 'null' มา (ตามที่เรากำหนดใน Hook) ให้แปลงเป็น null เพื่อใช้ในการกรอง SQL
  // ถ้าส่งค่าอื่นมา (เช่น 'S10'), ให้ใช้ค่านั้น
  const chemicalsTypeValue =
    chemicalsType === "null" || !chemicalsType ? null : chemicalsType;

  // --- การเรียกฐานข้อมูล ---

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    let sqlQuery = "";

    // 3. เพิ่ม Input Parameters
    request.input("cgWaterValue", sql.Float, parseFloat(cgWater));
    request.input("naclTypeValue", sql.NVarChar, naclType);
    // เพิ่ม Input Parameter สำหรับ Chemicals_Type (ใช้ NVarChar)
    request.input("chemicalsTypeValue", sql.NVarChar, chemicalsTypeValue);

    // 4. เริ่มต้น SQL Query ด้วยเงื่อนไขหลักสองข้อ
    sqlQuery = `
            SELECT 
                NaCl_NaCl_Water 
            FROM 
                Gen_NaCl_MT 
            WHERE 
                NaCl_CG_Water = @cgWaterValue 
            AND 
                NaCl_per_centum = @naclTypeValue
        `;

    // 🔽 5. เพิ่มเงื่อนไข Chemicals_Type ตาม Logic ที่คุณต้องการ
    if (chemicalsTypeValue !== null) {
      // กรณีที่ 1: มีการระบุ Chemicals_Type มา (เช่น 'S10')
      // ต้องค้นหาแถวที่มีค่า Chemicals_Type ตรงกันเท่านั้น
      sqlQuery += " AND Chemicals_Type = @chemicalsTypeValue";
    } else {
      // กรณีที่ 2: ไม่ได้ระบุ Chemicals_Type มา (ส่งมาเป็น 'null')
      // ต้องค้นหาแถวที่คอลัมน์ Chemicals_Type ในฐานข้อมูลเป็น NULL เท่านั้น
      sqlQuery += " AND Chemicals_Type IS NULL";
    }

    const result = await request.query(sqlQuery);

    if (result.recordset.length > 0) {
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).send({
        message: `Value not found in NaCl table for CG Water ${cgWater}, Type ${naclType}, and Chemicals Type ${chemicalsTypeValue === null ? "NULL" : chemicalsTypeValue
          }.`,
      });
    }
  } catch (err) {
    console.error("Database Lookup Error:", err);
    res.status(500).send({ message: err.message });
  }
};
