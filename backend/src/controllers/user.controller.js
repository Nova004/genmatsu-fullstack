// backend/src/controllers/user.controller.js

const { pool, sql, poolConnect } = require("../db.js");
const activityLogRepository = require("../repositories/activityLog.repository");
const { getObjectDiff } = require("../utils/diffHelper");

// --- ฟังก์ชันดึงข้อมูล User ทั้งหมด ---

exports.getAllUsersWithGenManu = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        m.agt_member_id,
        m.agt_member_nameTH,
        m.agt_member_nameEN,
        m.agt_member_nickname,
        p.agt_position_name,
        s.name_section,
        m.agt_member_type,
        m.agt_member_shift,
        m.agt_status_job,
        m.agt_member_location,
        gm.Gen_Manu_mem_No,  
        gm.LV_Approvals
      FROM 
        dbo.agt_member AS m
      LEFT JOIN 
        dbo.agt_position AS p ON m.agt_member_position = p.agt_position_id COLLATE DATABASE_DEFAULT
      LEFT JOIN 
        dbo.agt_section AS s ON m.agt_member_section = s.id_section COLLATE DATABASE_DEFAULT
      -- 1. เพิ่ม LEFT JOIN ตาราง Gen_Manu_Member เข้ามา --
      LEFT JOIN 
        dbo.Gen_Manu_Member AS gm ON m.agt_member_id = gm.Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT
      WHERE
         m.agt_status_job = 'Working' 
         AND m.agt_member_section = 'S010'
        AND m.agt_member_position IN ('P012', 'P013', 'P015','P010','P009')
      ORDER BY 
        m.agt_member_id;
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// --- ฟังก์ชันค้นหา User ---
exports.searchUsers = async (req, res) => {
  const { term } = req.query;
  try {
    await poolConnect;
    const result = await pool.request().input("term", sql.NVarChar, `%${term}%`)
      .query(`
        SELECT 
          agt_member_id as id, 
          agt_member_nameEN as name,
          agt_member_id as number
        FROM agt_member 
        WHERE agt_member_nameEN LIKE @term OR agt_member_nameTH LIKE @term OR agt_member_id LIKE @term
      `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// (ใน user.controller.js)


// === (แก้ไข) ฟังก์ชัน Upsert Employee No และ LV ===
// (Frontend เรียกใช้: apiService.put('/api/users/gen-manu-data'))
// =============================================================
exports.updateUserGenManuData = async (req, res) => {
  try {
    const { agtMemberId, genManuMemNo, lvApprovals, updatedBy } = req.body; // Added updatedBy

    if (!agtMemberId) {
      return res.status(400).json({ message: "agtMemberId is required." });
    }
    if (lvApprovals === undefined || lvApprovals === null) {
      return res.status(400).json({ message: "lvApprovals is required." });
    }

    await poolConnect;

    // 🚀 [แก้ไขจุดที่ 1] (เพิ่ม COLLATE)
    // --- 🔍 Fetch OLD Data for Diff Log ---
    const existingRecordRequest = await pool
      .request()
      .input("id", sql.NVarChar, agtMemberId).query(`
        SELECT * FROM Gen_Manu_Member 
        WHERE Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT = @id COLLATE DATABASE_DEFAULT
      `);

    const existingRecord = existingRecordRequest.recordset.length > 0 ? existingRecordRequest.recordset[0] : null;

    if (existingRecord) {
      // --- UPDATE ---

      // 🚀 [แก้ไขจุดที่ 2] (เพิ่ม COLLATE)
      await pool
        .request()
        .input("id", sql.NVarChar, agtMemberId)
        .input("no", sql.NVarChar, genManuMemNo || "")
        .input("lv", sql.Int, lvApprovals)
        .query(
          `UPDATE Gen_Manu_Member 
           SET 
             Gen_Manu_mem_No = @no, 
             LV_Approvals = @lv 
           WHERE 
             Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT = @id COLLATE DATABASE_DEFAULT`
        );
    } else {
      // --- INSERT ---

      // 🚀 [แก้ไขจุดที่ 3] (เพิ่ม COLLATE ใน WHERE)
      const memberDataResult = await pool
        .request()
        .input("id", sql.NVarChar, agtMemberId).query(`
          SELECT 
            m.agt_member_nameEN, p.agt_position_name, m.agt_member_shift
          FROM dbo.agt_member AS m
          LEFT JOIN dbo.agt_position AS p ON m.agt_member_position = p.agt_position_id COLLATE DATABASE_DEFAULT
          WHERE 
            m.agt_member_id COLLATE DATABASE_DEFAULT = @id COLLATE DATABASE_DEFAULT
        `);

      if (memberDataResult.recordset.length === 0) {
        return res
          .status(404)
          .json({ message: "Member not found in agt_member table." });
      }
      const memberData = memberDataResult.recordset[0];

      // (Query INSERT นี้ไม่ต้องแก้ เพราะมันไม่ได้เปรียบเทียบ)
      await pool
        .request()
        .input("id", sql.NVarChar, agtMemberId)
        .input("no", sql.NVarChar, genManuMemNo || "")
        .input("lv", sql.Int, lvApprovals || "")
        .input("nameEN", sql.NVarChar, memberData.agt_member_nameEN)
        .input("position", sql.NVarChar, memberData.agt_position_name)
        .input("shift", sql.NVarChar, memberData.agt_member_shift).query(`
          INSERT INTO Gen_Manu_Member 
            (Gen_Manu_mem_Memid, Gen_Manu_mem_No, LV_Approvals, Gen_Manu_mem_NamEN, Gen_Manu_mem_Position, Gen_Manu_mem_Shift) 
          VALUES 
            (@id, @no, @lv, @nameEN, @position, @shift)
        `);
    }

    // --- 📝 LOGGING ---
    try {
      const newData = { Gen_Manu_mem_No: genManuMemNo, LV_Approvals: lvApprovals };
      // If specific fields were not present in old record (it was null), undefined will handle it
      const relevantOldData = {
        Gen_Manu_mem_No: existingRecord ? existingRecord.Gen_Manu_mem_No : undefined,
        LV_Approvals: existingRecord ? existingRecord.LV_Approvals : undefined
      };

      const differences = getObjectDiff(relevantOldData, newData);

      if (differences.length > 0) {
        await activityLogRepository.createLog({
          userId: updatedBy || "Unknown",
          actionType: "UPDATE_USER_GEN_MANU",
          targetModule: "MASTER_USER",
          targetId: agtMemberId, // Employee ID being edited
          details: {
            message: `Updated User Master Data for ${agtMemberId}`,
            changes: differences
          }
        });
      }
    } catch (logErr) {
      console.error("Failed to log User Master update:", logErr);
    }

    res.status(200).json({ message: "User data updated successfully." });
  } catch (error) {
    console.error("Error in updateUserGenManuData:", error);
    res.status(500).json({
      message: "Error updating user data",
      error: error.message,
    });
  }
};

// =============================================================
// === ฟังก์ชันสำหรับค้นหา User จาก ID ===
// =============================================================
exports.findUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "กรุณาระบุรหัสพนักงาน" });
    }

    // 2. "รอ" ให้สัญญาณไฟเขียว (poolConnect) ทำงานเสร็จก่อน
    await poolConnect;

    // 3. เมื่อเชื่อมต่อสำเร็จแล้ว ก็สามารถใช้ "pool" ได้เลย
    const result = await pool.request().input("employeeId", sql.VarChar, id)
      .query(`
        SELECT 
            -- 1. [แก้ไข] ดึงชื่อจริงจาก agt_member
            am.agt_member_nameEN, 
            
            -- 2. [เหมือนเดิม] ดึงเบอร์จาก Gen_Manu_Member
            gmm.Gen_Manu_mem_No,

            -- 3. [เพิ่ม] ดึง Level มาด้วย (สำคัญมาก)
            gmm.LV_Approvals 
        FROM 
            -- (ต้องใช้ชื่อเต็มเพื่อความปลอดภัย)
            AGT_SMART_SY.dbo.Gen_Manu_Member gmm
        
        -- 4. [เพิ่ม] JOIN ตาราง agt_member
        LEFT JOIN 
            AGT_SMART_SY.dbo.agt_member am 
            ON gmm.Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT = am.agt_member_id COLLATE DATABASE_DEFAULT
        WHERE 
            gmm.Gen_Manu_mem_Memid = @employeeId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลพนักงาน" });
    }

    const user = result.recordset[0];

    res.status(200).json({
      fullName: user.agt_member_nameEN, // 👈 แก้ไขที่นี่
      userNumber: user.Gen_Manu_mem_No,
      level: user.LV_Approvals, // 👈 (ผมเพิ่ม Level กลับไปให้ด้วย เผื่อ Frontend ต้องใช้)
    });

  } catch (error) {
    console.error("Error in findUserById:", error); // เพิ่ม context ให้ error log
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};
