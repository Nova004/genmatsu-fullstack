// backend/src/repositories/ironpowder.repository.js

const { sql } = require("../db");

exports.getUserApprovalLevel = async (pool, userId) => {
  try {
    const result = await pool
      .request()
      .input("userId", sql.NVarChar, userId)
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
  submissionId,
  flowSteps,
  tableName = "Form_Ironpowder_Submissions"
) => {
  try {
    for (const step of flowSteps) {
      await transaction
        .request()
        .input("submissionId", sql.Int, submissionId)
        .input("sequence", sql.Int, step.sequence)
        .input("requiredLevel", sql.Int, step.required_level)
        .input("status", sql.NVarChar, "Pending")
        .input("tableName", sql.NVarChar, tableName)
        .query(`
          INSERT INTO Gen_Approval_Flow 
          (submission_id, sequence, required_level, status)
          VALUES (@submissionId, @sequence, @requiredLevel, @status)
        `);
    }
    console.log(`[Repo] Created ${flowSteps.length} approval flow steps`);
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
        FROM Gen_Approval_Flow
        WHERE submission_id = @submissionId
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
      .input("submissionId", sql.Int, submissionId)
      .query(`
        SELECT *
        FROM Gen_Approved_log
        WHERE submission_id = @submissionId
        ORDER BY created_at DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting approved logs:", error);
    throw error;
  }
};
