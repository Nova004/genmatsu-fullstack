// backend/src/services/ironpowder.service.js

const { sql, poolConnect } = require("../db");
const ironpowderRepo = require("../repositories/ironpowder.repository");

exports.checkLotNoExists = async (lotNo) => {
  try {
    const pool = await poolConnect;
    const result = await pool
      .request()
      .input("lotNo", sql.NVarChar, lotNo)
      .query(`
        SELECT TOP 1 ironpowder_id 
        FROM Form_Ironpowder_Submissions 
        WHERE lot_no = @lotNo
      `);

    return result.recordset.length > 0;
  } catch (error) {
    console.error("Error checking LotNo:", error);
    throw error;
  }
};

async function createApprovalFlow(pool, ironpowderId, submittedBy) {
  let transaction;
  try {
    console.log(
      `[Approval] Creating flow for IronpowderID: ${ironpowderId}, By: ${submittedBy}`
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
        ironpowderId,
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

exports.createIronpowder = async ({
  lotNo,
  formData,
  submittedBy,
}) => {
  let transaction;
  try {
    const pool = await poolConnect;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Extract key data from formData
    const totalInput = formData.totalInput || 0;
    const totalOutput = formData.totalOutput || 0;
    const diffWeight = totalInput - totalOutput;
    const reportDate = formData.basicData?.date || null;
    const machineName = formData.basicData?.machineName || null;

    // Insert into Form_Ironpowder_Submissions
    const result = await transaction
      .request()
      .input("lotNo", sql.NVarChar, lotNo)
      .input("formType", sql.NVarChar, "Ironpowder")
      .input("submittedBy", sql.Int, submittedBy)
      .input("status", sql.NVarChar, "Submitted")
      .input("reportDate", sql.Date, reportDate)
      .input("machineName", sql.NVarChar, machineName)
      .input("totalInput", sql.Decimal(10, 2), totalInput)
      .input("totalOutput", sql.Decimal(10, 2), totalOutput)
      .input("diffWeight", sql.Decimal(10, 2), diffWeight)
      .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData))
      .query(`
        INSERT INTO Form_Ironpowder_Submissions 
        (lot_no, form_type, submitted_by, status, report_date, machine_name, total_input, total_output, diff_weight, form_data_json, created_at, updated_at)
        VALUES (@lotNo, @formType, @submittedBy, @status, @reportDate, @machineName, @totalInput, @totalOutput, @diffWeight, @formDataJson, GETDATE(), GETDATE())
        
        SELECT SCOPE_IDENTITY() as ironpowder_id
      `);

    const ironpowderId = result.recordset[0].ironpowder_id;
    
    await transaction.commit();

    // Create approval flow (ไม่ใช้ transaction แล้ว)
    const pool2 = await poolConnect;
    await createApprovalFlow(pool2, ironpowderId, submittedBy);

    console.log(
      `[Ironpowder] Successfully created ironpowder ID: ${ironpowderId}`
    );
    return ironpowderId;
  } catch (error) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    console.error("Error creating ironpowder:", error);
    throw error;
  }
};

exports.getAllIronpowder = async () => {
  try {
    const pool = await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        ironpowder_id,
        lot_no,
        form_type,
        submitted_by,
        submission_date,
        status,
        report_date,
        machine_name,
        total_input,
        total_output,
        diff_weight,
        created_at,
        updated_at
      FROM Form_Ironpowder_Submissions
      ORDER BY created_at DESC
    `);

    return result.recordset;
  } catch (error) {
    console.error("Error fetching ironpowder list:", error);
    throw error;
  }
};

exports.getIronpowderById = async (ironpowderId) => {
  try {
    const pool = await poolConnect;
    const result = await pool
      .request()
      .input("ironpowderId", sql.Int, ironpowderId)
      .query(`
        SELECT 
          ironpowder_id,
          lot_no,
          form_type,
          submitted_by,
          submission_date,
          status,
          report_date,
          machine_name,
          total_input,
          total_output,
          diff_weight,
          form_data_json,
          created_at,
          updated_at
        FROM Form_Ironpowder_Submissions
        WHERE ironpowder_id = @ironpowderId
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

exports.updateIronpowder = async (ironpowderId, formData) => {
  try {
    const pool = await poolConnect;

    // Extract key data
    const totalInput = formData.totalInput || 0;
    const totalOutput = formData.totalOutput || 0;
    const diffWeight = totalInput - totalOutput;
    const reportDate = formData.basicData?.date || null;
    const machineName = formData.basicData?.machineName || null;

    await pool
      .request()
      .input("ironpowderId", sql.Int, ironpowderId)
      .input("reportDate", sql.Date, reportDate)
      .input("machineName", sql.NVarChar, machineName)
      .input("totalInput", sql.Decimal(10, 2), totalInput)
      .input("totalOutput", sql.Decimal(10, 2), totalOutput)
      .input("diffWeight", sql.Decimal(10, 2), diffWeight)
      .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData))
      .query(`
        UPDATE Form_Ironpowder_Submissions
        SET 
          report_date = @reportDate,
          machine_name = @machineName,
          total_input = @totalInput,
          total_output = @totalOutput,
          diff_weight = @diffWeight,
          form_data_json = @formDataJson,
          updated_at = GETDATE()
        WHERE ironpowder_id = @ironpowderId
      `);

    console.log(`[Ironpowder] Successfully updated ironpowder ID: ${ironpowderId}`);
  } catch (error) {
    console.error("Error updating ironpowder:", error);
    throw error;
  }
};

exports.deleteIronpowder = async (ironpowderId) => {
  try {
    const pool = await poolConnect;
    await pool
      .request()
      .input("ironpowderId", sql.Int, ironpowderId)
      .query(`
        DELETE FROM Form_Ironpowder_Submissions
        WHERE ironpowder_id = @ironpowderId
      `);

    console.log(`[Ironpowder] Successfully deleted ironpowder ID: ${ironpowderId}`);
  } catch (error) {
    console.error("Error deleting ironpowder:", error);
    throw error;
  }
};

exports.resubmitIronpowder = async (ironpowderId, formData, submittedBy) => {
  try {
    const pool = await poolConnect;

    // Extract key data
    const totalInput = formData.totalInput || 0;
    const totalOutput = formData.totalOutput || 0;
    const diffWeight = totalInput - totalOutput;
    const reportDate = formData.basicData?.date || null;
    const machineName = formData.basicData?.machineName || null;

    // Update status to Submitted
    await pool
      .request()
      .input("ironpowderId", sql.Int, ironpowderId)
      .input("status", sql.NVarChar, "Submitted")
      .input("reportDate", sql.Date, reportDate)
      .input("machineName", sql.NVarChar, machineName)
      .input("totalInput", sql.Decimal(10, 2), totalInput)
      .input("totalOutput", sql.Decimal(10, 2), totalOutput)
      .input("diffWeight", sql.Decimal(10, 2), diffWeight)
      .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData))
      .query(`
        UPDATE Form_Ironpowder_Submissions
        SET 
          status = @status,
          report_date = @reportDate,
          machine_name = @machineName,
          total_input = @totalInput,
          total_output = @totalOutput,
          diff_weight = @diffWeight,
          form_data_json = @formDataJson,
          updated_at = GETDATE()
        WHERE ironpowder_id = @ironpowderId
      `);

    // Create new approval flow
    await createApprovalFlow(pool, ironpowderId, submittedBy);

    console.log(`[Ironpowder] Successfully resubmitted ironpowder ID: ${ironpowderId}`);
  } catch (error) {
    console.error("Error resubmitting ironpowder:", error);
    throw error;
  }
};
