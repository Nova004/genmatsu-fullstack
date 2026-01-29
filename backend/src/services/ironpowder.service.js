// backend/src/services/ironpowder.service.js

const { sql, poolConnect } = require("../db");
const ironpowderRepo = require("../repositories/ironpowder.repository");
const activityLogRepo = require("../repositories/activityLog.repository"); // ✅ Import Logger
const { cleanSubmissionData } = require("../utils/dataCleaner");

exports.checkLotNoExists = async (lotNo) => {
  try {
    const pool = await poolConnect;
    const result = await pool.request().input("lotNo", sql.NVarChar, lotNo)
      .query(`
        SELECT TOP 1 submissionId 
        FROM Form_Ironpowder_Submissions 
        WHERE lot_no = @lotNo
      `);

    return result.recordset.length > 0;
  } catch (error) {
    console.error("Error checking LotNo:", error);
    throw error;
  }
};

async function createApprovalFlow(pool, submissionId, submittedBy) {
  let transaction;
  try {
    console.log(
      `[Approval] Creating flow for submissionId: ${submissionId}, By: ${submittedBy}`
    );

    const userLevel = await ironpowderRepo.getUserApprovalLevel(
      pool,
      submittedBy
    );

    if (userLevel === null) {
      console.error(`[Approval] User not found: ${submittedBy}`);
      return;
    }

    console.log(`[Approval] User Level is: ${userLevel}`);

    const flowSteps = [];
    if (userLevel === 0) {
      flowSteps.push({ sequence: 1, required_level: 1 });
      flowSteps.push({ sequence: 2, required_level: 2 });
      flowSteps.push({ sequence: 3, required_level: 3 });
    } else if (userLevel === 1) {
      flowSteps.push({ sequence: 1, required_level: 2 });
      flowSteps.push({ sequence: 2, required_level: 3 });
    } else if (userLevel === 2) {
      flowSteps.push({ sequence: 1, required_level: 3 });
    }

    if (flowSteps.length > 0) {
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      await ironpowderRepo.createApprovalFlowSteps(
        transaction,
        submissionId,
        flowSteps,
        "Form_Ironpowder_Submissions"
      );

      await transaction.commit();
      console.log(
        `[Approval] Successfully created ${flowSteps.length} approval steps.`
      );
    } else {
      console.log(
        `[Approval] No approval required for this user level (${userLevel}).`
      );
    }
  } catch (error) {
    console.error("Error creating approval flow:", error.message);
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
  }
}

exports.createIronpowder = async ({ lotNo, formData, submittedBy }) => {
  let transaction;
  try {
    const pool = await poolConnect;

    const cleanedFormData = cleanSubmissionData(formData);

    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const totalInput = cleanedFormData.totalInput || 0;
    const totalOutput = cleanedFormData.totalOutput || 0;
    const diffWeight = cleanedFormData.diffWeight || 0; // หรือคำนวณใหม่ก็ได้

    // ค่าใหม่ที่เพิ่มเข้ามา
    const totalGenmatsuA = formData.totalGenmatsuA || 0;
    const totalGenmatsuB = formData.totalGenmatsuB || 0;
    const totalFilm = formData.totalFilm || 0;
    const totalPEBag = formData.totalPEBag || 0;
    const totalDustCollector = formData.totalDustCollector || 0;
    const totalCleaning = formData.totalCleaning || 0;
    const quantityOfProductCans = formData.quantityOfProductCans || 0; // ✅ New Field

    const reportDate = formData.basicData?.date || null;
    const machineName = formData.basicData?.machineName || null;

    // Insert into Form_Ironpowder_Submissions
    const result = await transaction
      .request()
      .input("lotNo", sql.NVarChar, lotNo)
      .input("formType", sql.NVarChar, "Ironpowder")
      .input("submittedBy", sql.Int, submittedBy)
      .input("status", sql.NVarChar, "Draft")
      .input("reportDate", sql.Date, reportDate)
      .input("machineName", sql.NVarChar, machineName)
      .input("totalInput", sql.Decimal(10, 2), totalInput)
      .input("totalOutput", sql.Decimal(10, 2), totalOutput)
      .input("diffWeight", sql.Decimal(10, 2), diffWeight)
      .input("totalGenmatsuA", sql.Decimal(10, 2), totalGenmatsuA)
      .input("totalGenmatsuB", sql.Decimal(10, 2), totalGenmatsuB)
      .input("totalFilm", sql.Decimal(10, 2), totalFilm)
      .input("totalPEBag", sql.Decimal(10, 2), totalPEBag)
      .input("totalDustCollector", sql.Decimal(10, 2), totalDustCollector)
      .input("totalCleaning", sql.Decimal(10, 2), totalCleaning)
      .input("quantityOfProductCans", sql.Int, quantityOfProductCans) // ✅ Bind Param
      .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(cleanedFormData))
      .query(`
        INSERT INTO Form_Ironpowder_Submissions 
        (
          lot_no, form_type, submitted_by, status, report_date, machine_name, 
          total_input, total_output, diff_weight, 
          total_genmatsu_a, total_genmatsu_b, total_film, total_pe_bag, total_dust_collector, total_cleaning, 
          quantity_of_product_cans, -- ✅ New Column
          form_data_json, created_at, updated_at
        )
        VALUES (
          @lotNo, @formType, @submittedBy, @status, @reportDate, @machineName, 
          @totalInput, @totalOutput, @diffWeight,
          @totalGenmatsuA, @totalGenmatsuB, @totalFilm, @totalPEBag, @totalDustCollector, @totalCleaning, 
          @quantityOfProductCans, -- ✅ New Value
          @formDataJson, GETDATE(), GETDATE()
        )
        SELECT SCOPE_IDENTITY() as submissionId
      `);

    const submissionId = result.recordset[0].submissionId;

    await transaction.commit();

    // Create approval flow (ไม่ใช้ transaction แล้ว)
    const pool2 = await poolConnect;
    await createApprovalFlow(pool2, submissionId, submittedBy);

    console.log(
      `[Ironpowder] Successfully created ironpowder ID: ${submissionId}`
    );

    // ✅ Log Activity
    await activityLogRepo.createLog({
      userId: submittedBy,
      actionType: 'CREATE',
      targetModule: 'Ironpowder (Recycle)',
      targetId: submissionId,
      details: `Created Recycle report Lot No: ${lotNo}`
    });

    return submissionId;
  } catch (error) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    console.error("Error creating ironpowder:", error);
    throw error;
  }
};

exports.getAllIronpowder = async (params) => {
  try {
    const pool = await poolConnect;
    const result = await ironpowderRepo.getAllIronpowder(pool, params);

    // result is now { data: [...], total: number }
    return {
      data: result.data,
      total: result.total
    };
  } catch (error) {
    console.error("Error fetching ironpowder list:", error);
    throw error;
  }
};


exports.getIronpowderById = async (submissionId) => {
  try {
    const pool = await poolConnect;
    const result = await pool
      .request()
      .input("submissionId", sql.Int, submissionId).query(`
        SELECT 
          fs.submissionId,
          fs.lot_no,
          fs.form_type,
          fs.submitted_by,
          u.agt_member_nameEN AS submitted_by_name, -- ✅ เพิ่มชื่อผู้บันทึก
          fs.report_date,
          fs.status,
          fs.machine_name,
          fs.total_input,
          fs.total_output,
          fs.diff_weight,
          fs.form_data_json,
          fs.created_at,
          fs.updated_at
        FROM Form_Ironpowder_Submissions fs
        LEFT JOIN AGT_SMART_SY.dbo.agt_member u
          ON CAST(fs.submitted_by AS NVARCHAR(50)) COLLATE Thai_CI_AS = u.agt_member_id
        WHERE fs.submissionId = @submissionId
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const data = result.recordset[0];
    return {
      ...data,
      form_data_json: JSON.parse(data.form_data_json),
    };
  } catch (error) {
    console.error("Error fetching ironpowder by ID:", error);
    throw error;
  }
};

const { getObjectDiff } = require("../utils/diffHelper"); // ✅ Import Diff Helper
// ironpowderRepo is already imported at the top

exports.updateIronpowder = async (submissionId, formData, userId) => {
  try {
    const pool = await poolConnect;

    // 1. Fetch info BEFORE update for Diffing
    // We can use the Repo function directly if exported, or query directly
    // Let's query directly to avoid circular dependency issues if any
    const oldDataResult = await pool.request()
      .input("submissionId", sql.Int, submissionId)
      .query("SELECT form_data_json, lot_no FROM Form_Ironpowder_Submissions WHERE submissionId = @submissionId");

    const oldRecord = oldDataResult.recordset[0];
    const oldFormData = oldRecord ? JSON.parse(oldRecord.form_data_json || "{}") : {};
    const oldLotNo = oldRecord ? oldRecord.lot_no : "Unknown";

    // Extract key data
    const totalInput = formData.totalInput || 0;
    const totalOutput = formData.totalOutput || 0;
    const diffWeight = totalInput - totalOutput;
    const reportDate = formData.basicData?.date || null;
    const machineName = formData.basicData?.machineName || null;
    const lotNo = formData.basicData?.lotNo || null; // Extract Lot No

    // Extract additional calculated fields to sync with columns
    const totalGenmatsuA = formData.totalGenmatsuA || 0;
    const totalGenmatsuB = formData.totalGenmatsuB || 0;
    const totalFilm = formData.totalFilm || 0;
    const totalPEBag = formData.totalPEBag || 0;
    const totalDustCollector = formData.totalDustCollector || 0;
    const totalCleaning = formData.totalCleaning || 0;
    const quantityOfProductCans = formData.quantityOfProductCans || 0; // ✅ New Field

    await pool
      .request()
      .input("submissionId", sql.Int, submissionId)
      .input("reportDate", sql.Date, reportDate)
      .input("machineName", sql.NVarChar, machineName)
      .input("lotNo", sql.NVarChar, lotNo) // Input Lot No
      .input("totalInput", sql.Decimal(10, 2), totalInput)
      .input("totalOutput", sql.Decimal(10, 2), totalOutput)
      .input("diffWeight", sql.Decimal(10, 2), diffWeight)
      .input("totalGenmatsuA", sql.Decimal(10, 2), totalGenmatsuA)
      .input("totalGenmatsuB", sql.Decimal(10, 2), totalGenmatsuB)
      .input("totalFilm", sql.Decimal(10, 2), totalFilm)
      .input("totalPEBag", sql.Decimal(10, 2), totalPEBag)
      .input("totalDustCollector", sql.Decimal(10, 2), totalDustCollector)
      .input("totalCleaning", sql.Decimal(10, 2), totalCleaning)
      .input("quantityOfProductCans", sql.Int, quantityOfProductCans) // ✅ Bind Param
      .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData))
      .query(`
        UPDATE Form_Ironpowder_Submissions
        SET 
          report_date = @reportDate,
          machine_name = @machineName,
          lot_no = @lotNo, -- Update Lot No
          total_input = @totalInput,
          total_output = @totalOutput,
          diff_weight = @diffWeight,
          total_genmatsu_a = @totalGenmatsuA, -- Update new columns
          total_genmatsu_b = @totalGenmatsuB,
          total_film = @totalFilm,
          total_pe_bag = @totalPEBag,
          total_dust_collector = @totalDustCollector,
          total_cleaning = @totalCleaning,
          quantity_of_product_cans = @quantityOfProductCans, -- ✅ New Column
          form_data_json = @formDataJson,
          updated_at = GETDATE()
        WHERE submissionId = @submissionId
      `);

    console.log(
      `[Ironpowder] Successfully updated ironpowder ID: ${submissionId}`
    );

    // ✅ Generate Diff Summary
    const changes = getObjectDiff(oldFormData, formData);
    const changesText = changes.length > 0 ? ` Changes: ${changes.join(", ").substring(0, 500)}` : " (No content changes)";

    // ✅ Log Activity
    await activityLogRepo.createLog({
      userId: userId,
      actionType: 'UPDATE',
      targetModule: 'Ironpowder (Recycle)',
      targetId: submissionId,
      details: `Updated Lot No: ${lotNo}.${changesText}`
    });
  } catch (error) {
    console.error("Error updating ironpowder:", error);
    throw error;
  }
};

exports.deleteIronpowder = async (submissionId, userId) => {
  try {
    const pool = await poolConnect;

    // 1. Get info before delete for logging
    const checkResult = await pool.request()
      .input("submissionId", sql.Int, submissionId)
      .query("SELECT lot_no FROM Form_Ironpowder_Submissions WHERE submissionId = @submissionId");

    const lotNo = checkResult.recordset[0]?.lot_no || 'Unknown';

    await pool.request().input("submissionId", sql.Int, submissionId).query(`
        DELETE FROM Form_Ironpowder_Submissions
        WHERE submissionId = @submissionId
      `);

    console.log(
      `[Ironpowder] Successfully deleted ironpowder ID: ${submissionId}`
    );

    // ✅ Log Activity
    await activityLogRepo.createLog({
      userId: userId,
      actionType: 'DELETE',
      targetModule: 'Ironpowder (Recycle)',
      targetId: submissionId,
      details: `Deleted Recycle report Lot No: ${lotNo}`
    });
  } catch (error) {
    console.error("Error deleting ironpowder:", error);
    throw error;
  }
};

exports.resubmitIronpowder = async (submissionId, formData, userId) => {
  try {
    const pool = await poolConnect;

    // 1. Fetch info BEFORE update for Diffing
    const oldDataResult = await pool.request()
      .input("submissionId", sql.Int, submissionId)
      .query("SELECT form_data_json, lot_no FROM Form_Ironpowder_Submissions WHERE submissionId = @submissionId");

    const oldRecord = oldDataResult.recordset[0];
    const oldFormData = oldRecord ? JSON.parse(oldRecord.form_data_json || "{}") : {};
    const oldLotNo = oldRecord ? oldRecord.lot_no : "Unknown";

    // Extract key data
    const totalInput = formData.totalInput || 0;
    const totalOutput = formData.totalOutput || 0;
    const diffWeight = totalInput - totalOutput;
    const reportDate = formData.basicData?.date || null;
    const machineName = formData.basicData?.machineName || null;
    const lotNo = formData.basicData?.lotNo || null; // Extract Lot No

    // Extract additional calculated fields to sync with columns
    const totalGenmatsuA = formData.totalGenmatsuA || 0;
    const totalGenmatsuB = formData.totalGenmatsuB || 0;
    const totalFilm = formData.totalFilm || 0;
    const totalPEBag = formData.totalPEBag || 0;
    const totalDustCollector = formData.totalDustCollector || 0;
    const totalCleaning = formData.totalCleaning || 0;
    const quantityOfProductCans = formData.quantityOfProductCans || 0; // ✅ New Field

    // Update status to Draft
    await pool
      .request()
      .input("submissionId", sql.Int, submissionId)
      .input("status", sql.NVarChar, "Pending")
      .input("reportDate", sql.Date, reportDate)
      .input("machineName", sql.NVarChar, machineName)
      .input("lotNo", sql.NVarChar, lotNo) // Input Lot No
      .input("totalInput", sql.Decimal(10, 2), totalInput)
      .input("totalOutput", sql.Decimal(10, 2), totalOutput)
      .input("diffWeight", sql.Decimal(10, 2), diffWeight)
      .input("totalGenmatsuA", sql.Decimal(10, 2), totalGenmatsuA)
      .input("totalGenmatsuB", sql.Decimal(10, 2), totalGenmatsuB)
      .input("totalFilm", sql.Decimal(10, 2), totalFilm)
      .input("totalPEBag", sql.Decimal(10, 2), totalPEBag)
      .input("totalDustCollector", sql.Decimal(10, 2), totalDustCollector)
      .input("totalCleaning", sql.Decimal(10, 2), totalCleaning)
      .input("quantityOfProductCans", sql.Int, quantityOfProductCans) // ✅ Bind Param
      .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData))
      .query(`
        UPDATE Form_Ironpowder_Submissions
        SET 
          status = @status,
          report_date = @reportDate,
          machine_name = @machineName,
          lot_no = @lotNo, -- Update Lot No
          total_input = @totalInput,
          total_output = @totalOutput,
          diff_weight = @diffWeight,
          total_genmatsu_a = @totalGenmatsuA, -- Update new columns
          total_genmatsu_b = @totalGenmatsuB,
          total_film = @totalFilm,
          total_pe_bag = @totalPEBag,
          total_dust_collector = @totalDustCollector,
          total_cleaning = @totalCleaning,
          quantity_of_product_cans = @quantityOfProductCans, -- ✅ New Column
          form_data_json = @formDataJson,
          updated_at = GETDATE()
        WHERE submissionId = @submissionId

        -- [Resubmit Reset]
        -- 1. Reset Flow Status & Approver (เพื่อให้เริ่มอนุมัติใหม่ โดยไม่ลบแถว)
        -- 🔴 แก้ไข: set updated_at = NULL เพื่อให้ Frontend ไม่แสดงวันที่
        UPDATE Form_Ironpowder_Approval_Flow
        SET status = 'Pending', approver_user_id = NULL, updated_at = NULL
        WHERE submissionId = @submissionId;

        -- 2. ลบ Log เดิมทิ้ง (เพื่อให้เริ่มอนุมัติใหม่)
        DELETE FROM Form_Ironpowder_Approved_Log
        WHERE submissionId = @submissionId;
      `);

    console.log(
      `[Ironpowder] Successfully resubmitted ironpowder ID: ${submissionId}`
    );

    console.log(
      `[Ironpowder] Successfully resubmitted ironpowder ID: ${submissionId}`
    );

    // ✅ Generate Diff Summary
    const changes = getObjectDiff(oldFormData, formData);
    const changesText = changes.length > 0 ? ` Changes: ${changes.join(", ").substring(0, 500)}` : " (No content changes)";

    // ✅ Log Activity
    await activityLogRepo.createLog({
      userId: userId,
      actionType: 'RESUBMIT',
      targetModule: 'Ironpowder (Recycle)',
      targetId: submissionId,
      details: `Resubmitted Recycle report Lot No: ${lotNo}.${changesText}`
    });
  } catch (error) {
    console.error("Error resubmitting ironpowder:", error);
    throw error;
  }
};

exports.getIronpowderSummaryByDate = async (date) => {
  try {
    const pool = await poolConnect;
    const result = await pool.request().input("date", sql.Date, date).query(`
        SELECT 
          SUM(total_input) as totalInput,
          SUM(total_output) as totalOutput,
          SUM(total_genmatsu_a) as totalGenmatsuA,
          SUM(total_genmatsu_b) as totalGenmatsuB,
          SUM(total_film) as totalFilm,
          SUM(total_pe_bag) as totalPEBag,
          SUM(total_dust_collector) as totalDustCollector,
          SUM(total_cleaning) as totalCleaning,
          SUM(diff_weight) as diffWeight,
          SUM(quantity_of_product_cans) as totalCans,
          MAX(lot_no) as lotNo,
          MAX(machine_name) as machineName
        FROM Form_Ironpowder_Submissions
        WHERE report_date = @date AND status != 'Rejected'
      `);

    return result.recordset[0] || {};
  } catch (error) {
    console.error("Error fetching ironpowder summary:", error);
    throw error;
  }
};
