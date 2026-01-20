// backend/src/repositories/ironpowder.repository.js

const { sql } = require("../db");

exports.getUserApprovalLevel = async (pool, userId) => {
  try {
    const result = await pool.request().input("userId", sql.NVarChar, userId)
      .query(`
        SELECT LV_Approvals
        FROM AGT_SMART_SY.dbo.Gen_Manu_Member
        WHERE Gen_Manu_mem_Memid COLLATE DATABASE_DEFAULT = @userId COLLATE DATABASE_DEFAULT
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0].LV_Approvals;
  } catch (error) {
    console.error("Error getting user approval level:", error);
    throw error;
  }
};

exports.createApprovalFlowSteps = async (
  transaction,
  submissionId, // ในที่นี้คือ submissionId
  flowSteps,
  tableName = "Form_Ironpowder_Submissions" // พารามิเตอร์นี้อาจไม่ได้ใช้ใน query แต่เก็บไว้ได้
) => {
  try {
    for (const step of flowSteps) {
      await transaction
        .request()
        .input("submissionId", sql.Int, submissionId) // เปลี่ยนชื่อ input ให้สื่อความหมาย (แต่ค่าที่ส่งมาคือ id เดิม)
        .input("sequence", sql.Int, step.sequence)
        .input("requiredLevel", sql.Int, step.required_level)
        .input("status", sql.NVarChar, "Pending").query(`
          INSERT INTO Form_Ironpowder_Approval_Flow 
          (submissionId, sequence, required_level, status)
          VALUES (@submissionId, @sequence, @requiredLevel, @status)
        `);
    }
    console.log(
      `[Repo] Created ${flowSteps.length} approval flow steps in Form_Ironpowder_Approval_Flow`
    );
  } catch (error) {
    console.error("Error creating approval flow steps:", error);
    throw error;
  }
};

exports.getApprovalFlowBySubmissionId = async (pool, submissionId) => {
  try {
    const result = await pool
      .request()
      .input("submissionId", sql.Int, submissionId)
      .query(`
        SELECT *
        FROM Form_Ironpowder_Approval_Flow
        WHERE submissionId = @submissionId
        ORDER BY sequence ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting approval flow:", error);
    throw error;
  }
};

exports.getApprovedLogs = async (pool, submissionId) => {
  try {
    const result = await pool
      .request()
      .input("submissionId", sql.Int, submissionId) // ใช้ตัวแปร submissionId ที่รับมานั่นแหละ
      .query(`
        SELECT *
        FROM Form_Ironpowder_Approved_Log  -- <-- เปลี่ยนเป็นตารางใหม่
        WHERE submissionId = @submissionId -- <-- เปลี่ยนชื่อคอลัมน์ให้ตรง
        ORDER BY created_at DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting approved logs:", error);
    throw error;
  }
};

exports.getAllIronpowder = async (pool) => {
  try {
    const result = await pool.request().query(`
      SELECT 
        submissionId,
        lot_no,
        form_type,
        submitted_by,
        status,
        report_date, -- <--- ต้องใช้ชื่อนี้
        machine_name,
        total_input,
        total_output,
        diff_weight,
        created_at
      FROM Form_Ironpowder_Submissions
      ORDER BY report_date DESC 
    `);

    return result.recordset;
  } catch (error) {
    console.error("Error fetching ironpowder list:", error);
    throw error;
  }
};
