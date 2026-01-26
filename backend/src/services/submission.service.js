const { sql, poolConnect } = require("../db"); // ✅ 1. เรียกใช้ poolConnect จากไฟล์กลาง
const submissionRepo = require("../repositories/submission.repository");
const activityLogRepo = require("../repositories/activityLog.repository"); // ✅ Import Logger
const { cleanSubmissionData } = require("../utils/dataCleaner");

exports.checkLotNoExists = async (lotNo) => {
  try {
    const pool = await poolConnect; // ✅ 2. ใช้ Pool กลาง
    const result = await pool.request().input("lotNo", sql.NVarChar, lotNo) // ป้องกัน SQL Injection
      .query(`
        SELECT TOP 1 fs.lot_no 
        FROM AGT_SMART_SY.dbo.Form_Submissions AS fs 
        WHERE fs.lot_no = @lotNo
      `);

    // ถ้าเจอข้อมูล recordset.length จะมากกว่า 0 แปลว่า "ซ้ำ" (return true)
    return result.recordset.length > 0;
  } catch (error) {
    console.error("Error checking LotNo:", error);
    throw error;
  }
};

// Helper function to create approval flow (Logic เดิมครบถ้วน)
async function createApprovalFlow(pool, submissionId, submittedBy) {
  let transaction;
  try {
    console.log(
      `[Approval] Creating flow for SubID: ${submissionId}, By: ${submittedBy}`
    );

    const userLevel = await submissionRepo.getUserApprovalLevel(
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

      await submissionRepo.createApprovalFlowSteps(
        transaction,
        submissionId,
        flowSteps
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

exports.getSubmissionDataForPdf = async (submissionId) => {
  const pool = await poolConnect; // ✅ 2. ใช้ Pool กลาง

  try {
    console.log(
      `[PDF-Helper] Fetching submission data for ID: ${submissionId}`
    );
    const submissionData = await submissionRepo.getSubmissionWithDetails(
      pool,
      submissionId
    );

    if (!submissionData) {
      // 🟡 Fallback: Check if it's an Ironpowder (Recycle) form
      console.log(`[PDF-Helper] Generic fetch failed. Trying Ironpowder for ID: ${submissionId}`);
      try {
        const ironpowderService = require("./ironpowder.service");
        const ironData = await ironpowderService.getIronpowderById(submissionId);

        if (ironData) {
          console.log(`[PDF-Helper] Found Ironpowder data for ID: ${submissionId}`);
          return {
            submission: {
              ...ironData,
              submission_id: ironData.submissionId, // Map to snake_case
              form_type: 'Ironpowder',
              // ironData.form_data_json is already parsed by getIronpowderById
              form_data_json: ironData.form_data_json,
            },
            blueprints: {}, // Ironpowder typically doesn't use the dynamic blueprints system
          };
        }
      } catch (ironError) {
        console.error(`[PDF-Helper] Ironpowder fetch also failed:`, ironError);
      }

      console.error(`[PDF-Helper] Submission not found: ${submissionId}`);
      throw new Error("Submission not found.");
    }

    const versionSetId = submissionData.version_set_id;

    console.log(
      `[PDF-Helper] Fetching blueprints for VersionSetID: ${versionSetId}`
    );
    const blueprintItems = await submissionRepo.getVersionSetItems(
      pool,
      versionSetId
    );

    const blueprints = {};
    blueprintItems.forEach((item) => {
      const templateName = item.template_name;
      if (!blueprints[templateName]) {
        blueprints[templateName] = {
          template: {
            template_id: item.template_id,
            template_name: item.template_name,
            template_category: item.template_category,
            version: item.version,
          },
          items: [],
        };
      }
      blueprints[templateName].items.push({
        item_id: item.item_id,
        display_order: item.display_order,
        config_json: JSON.parse(item.config_json),
      });
    });

    console.log(`[PDF-Helper] Data prepared successfully.`);
    return {
      submission: {
        ...submissionData,
        form_data_json: JSON.parse(submissionData.form_data_json),
      },
      blueprints: blueprints,
    };
  } finally {
    // ✅ 3. ลบ pool.close() ออก ห้ามปิด connection
  }
};

exports.updateStPlan = async (id, stTargetValue) => {
  const { sql, pool } = require("../db"); // หรือเรียกตามวิธีที่ Service อื่นใช้

  // ย้าย SQL มาไว้ที่นี่
  await pool
    .request()
    .input("id", sql.Int, id)
    .input("stVal", sql.Decimal(10, 2), stTargetValue).query(`
      UPDATE Form_Submission_Data
      SET st_target_value = @stVal
      WHERE submission_id = @id
    `);

  return true;
};

exports.createSubmission = async (data) => {
  const { formType, lotNo, templateIds, formData, submittedBy } = data;
  const cleanedFormData = cleanSubmissionData(formData);
  const pool = await poolConnect;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Find Category
    const correctCategory = await submissionRepo.getTemplateCategory(
      transaction,
      templateIds[0]
    );

    if (!correctCategory) {
      throw new Error(
        `Cannot find category for template ID: ${templateIds[0]}`
      );
    }

    // 2. Check Version Set
    let versionSetId = await submissionRepo.findExistingVersionSet(
      transaction,
      correctCategory,
      templateIds
    );

    if (!versionSetId) {
      await submissionRepo.deprecateOldVersionSet(transaction, correctCategory);
      versionSetId = await submissionRepo.createNewVersionSet(
        transaction,
        correctCategory
      );
      await submissionRepo.addItemsToVersionSet(
        transaction,
        versionSetId,
        templateIds
      );
    }

    // ดึง Key Metrics (รวมถึง NCR)
    const keyMetrics = extractKeyMetrics(cleanedFormData);

    // 🔴 คำนวณ ST Value ใหม่ (รวม NCR)
    const finalStValue = await calculateTotalStValue(
      transaction,
      formType,
      keyMetrics.ncrGenmatsuActual
    );

    keyMetrics.stTargetValue = finalStValue;

    // 3. Insert Submission
    // 🟡 แก้ไข: บังคับ status เป็น 'Drafted' เสมอ (ตามที่คุณต้องการ)
    const initialStatus = "Drafted";

    const submissionId = await submissionRepo.createSubmissionRecord(
      transaction,
      {
        versionSetId,
        formType,
        lotNo,
        submittedBy,
        productionLine: keyMetrics.productionLine,
        status: initialStatus, // ส่งค่า 'Drafted' ไปบันทึก
      }
    );

    // 4. Insert Form Data
    await submissionRepo.createSubmissionData(
      transaction,
      submissionId,
      cleanedFormData,
      keyMetrics
    );
    await transaction.commit();

    // ✅ Log Activity
    await activityLogRepo.createLog({
      userId: submittedBy,
      actionType: 'CREATE',
      targetModule: formType || 'GEN-A',
      targetId: submissionId,
      details: `Created new submission Lot No: ${lotNo}`
    });

    return submissionId;
  } catch (error) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw error;
  }
};

exports.getAllSubmissions = async (params) => {
  const pool = await poolConnect; // ✅ ใช้ Pool กลาง
  try {
    return await submissionRepo.getAllSubmissions(pool, params);
  } finally {
    // ✅ ลบ pool.close() ออก
  }
};

exports.getSubmissionById = async (id) => {
  return await this.getSubmissionDataForPdf(id);
};

exports.deleteSubmission = async (id, userId) => {
  const pool = await poolConnect; // ✅ ใช้ Pool กลาง
  const transaction = new sql.Transaction(pool);

  try {
    // 1. Get info before delete for logging
    const submissionInfo = await submissionRepo.getSubmissionWithDetails(pool, id);
    const targetModule = submissionInfo?.form_type || 'Submission';

    await transaction.begin();

    const isDeleted = await submissionRepo.deleteSubmissionRelatedData(
      transaction,
      id
    );

    if (!isDeleted) {
      await transaction.commit();
      return false; // Not found
    }

    await transaction.commit();

    // ✅ Log Activity
    await activityLogRepo.createLog({
      userId: userId,
      actionType: 'DELETE',
      targetModule: targetModule,
      targetId: id,
      details: `Deleted submission ID: ${id}`
    });

    return true; // Deleted
  } catch (err) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw err;
  } finally {
    // ✅ ลบ pool.close() ออก
  }
};

const { getObjectDiff } = require("../utils/diffHelper"); // ✅ Import Diff Helper

exports.updateSubmission = async (id, lot_no, form_data, userId) => {
  const pool = await poolConnect;
  const transaction = new sql.Transaction(pool);

  try {
    console.log(`🔥 [DEBUG] updateSubmission called for ID: ${id}`);

    // 1. Fetch info BEFORE update for Diffing & FormType
    const submissionInfo = await submissionRepo.getSubmissionWithDetails(pool, id);
    if (!submissionInfo) throw new Error("Submission not found");

    const formType = submissionInfo.form_type;
    const oldFormData = JSON.parse(submissionInfo.form_data_json || "{}"); // Parse Old Data

    await transaction.begin();

    const cleanedFormData = cleanSubmissionData(form_data);
    const keyMetrics = extractKeyMetrics(cleanedFormData);

    // 🔴 2. คำนวณ ST Value ใหม่ (Base + NCR)
    const finalStValue = await calculateTotalStValue(
      transaction,
      formType,
      keyMetrics.ncrGenmatsuActual
    );
    keyMetrics.stTargetValue = finalStValue;

    // 3. อัปเดตข้อมูล
    await submissionRepo.updateSubmissionRecord(
      transaction,
      id,
      lot_no,
      keyMetrics.productionLine
    );
    await submissionRepo.updateSubmissionData(
      transaction,
      id,
      cleanedFormData,
      keyMetrics
    );

    await transaction.commit();
    console.log("✅ [DEBUG] Update & Reset Transaction Committed!");

    // ✅ Generate Diff Summary
    const changes = getObjectDiff(oldFormData, cleanedFormData);
    const changesText = changes.length > 0 ? ` Changes: ${changes.join(", ").substring(0, 500)}` : " (No content changes)";

    // ✅ Log Activity
    await activityLogRepo.createLog({
      userId: userId,
      actionType: 'UPDATE',
      targetModule: formType || 'Submission',
      targetId: id,
      details: `Updated Lot No: ${lot_no}.${changesText}`
    });
  } catch (err) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    console.error("❌ [DEBUG] Error:", err);
    throw err;
  }
};


exports.getMyPendingTasks = async (userLevel, userId) => {
  const pool = await poolConnect;
  const ironpowderRepo = require("../repositories/ironpowder.repository"); // ✅ Import

  // 1. ดึงงานปกติ (Pending Approval)
  const standardTasks = await submissionRepo.getPendingSubmissionsByLevel(
    pool,
    userLevel
  );

  // 2. ดึงงาน Recycle (Pending Approval)
  let recycleTasks = [];
  try {
    recycleTasks = await ironpowderRepo.getPendingIronpowderByLevel(
      pool,
      userLevel
    );
  } catch (error) {
    console.error("Error fetching ironpowder pending tasks:", error);
  }

  // 3. (Optional) ดึงงานที่ถูก Reject ถ้ามี userId ส่งมา
  let rejectedStandard = [];
  let rejectedRecycle = [];

  if (userId) {
    try {
      rejectedStandard = await submissionRepo.getRejectedSubmissionsByUser(pool, userId);
    } catch (err) {
      console.error("Error fetching rejected standard tasks:", err);
    }

    try {
      rejectedRecycle = await ironpowderRepo.getRejectedIronpowderByUser(pool, userId);
    } catch (err) {
      console.error("Error fetching rejected recycle tasks:", err);
    }
  }

  // 4. รวมและเรียงลำดับตามเวลาล่าสุด
  const allTasks = [
    ...standardTasks,
    ...recycleTasks,
    ...rejectedStandard,
    ...rejectedRecycle
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return allTasks;
};

exports.resubmitSubmissionData = async (
  transaction,
  submissionId,
  formDataJson,
  keyMetrics,
  status
) => {
  const request = new sql.Request(transaction);

  // Prepare Inputs
  request.input("submissionId", sql.Int, submissionId);
  request.input(
    "formDataJson",
    sql.NVarChar(sql.MAX),
    JSON.stringify(formDataJson)
  );

  // Metrics Inputs
  request.input("inputKg", sql.Decimal(10, 2), keyMetrics.inputKg || null);
  request.input("outputKg", sql.Decimal(10, 2), keyMetrics.outputKg || null);
  request.input(
    "yieldPercent",
    sql.Decimal(5, 2),
    keyMetrics.yieldPercent || null
  );
  request.input("totalQty", sql.Int, keyMetrics.totalQty || null);
  request.input("productionDate", sql.Date, keyMetrics.productionDate || null);
  request.input(
    "palletData",
    sql.NVarChar(sql.MAX),
    JSON.stringify(keyMetrics.palletData || [])
  );

  // Status & Production Line Inputs
  request.input("status", sql.NVarChar, status || "Pending");
  request.input(
    "productionLine",
    sql.NVarChar,
    keyMetrics.productionLine || null
  );

  // 3.1 Update Data Content (เนื้อหา)
  await request.query(`
          UPDATE Form_Submission_Data 
          SET 
            form_data_json = @formDataJson,
            input_kg = @inputKg,
            output_kg = @outputKg,
            yield_percent = @yieldPercent,
            total_qty = @totalQty,
            production_date = @productionDate,
            pallet_data = @palletData
          WHERE submission_id = @submissionId
      `);

  // 3.2 Update Submission Header (สถานะเอกสาร + Line ผลิต)
  await request.query(`
          UPDATE Form_Submissions 
          SET 
              submitted_at = GETDATE(),
              status = @status,
              production_line = @productionLine
          WHERE 
              submission_id = @submissionId
              AND (status = 'Rejected' OR status = 'Drafted')
      `);

  // 🟡 3.3 ล้าง Flow เก่าทิ้งทั้งหมด (แก้จาก UPDATE เป็น DELETE)
  // เหตุผล:
  // 1. ถ้ามาจาก Draft จะได้ไม่มีปัญหา (เพราะไม่มีให้ลบ ก็ไม่ Error)
  // 2. ถ้ามาจาก Rejected ก็ลบของเก่าทิ้ง เพื่อรอสร้างใหม่ใน Service
  // 3. ถ้าเป็น LV3 (Approved) ก็ลบทิ้งไปเลย จบงานสวยๆ
  await request.query(`
      DELETE FROM Gen_Approval_Flow 
      WHERE submission_id = @submissionId
  `);

  // 3.4 Clear Logs (ลบประวัติการ Reject เดิมออก)
  await request.query(`
          DELETE FROM AGT_SMART_SY.dbo.Gen_Approved_log
          WHERE 
              submission_id = @submissionId
              AND action = 'Rejected' 
      `);
};

// backend/src/services/submission.service.js

exports.resubmitSubmission = async (id, formDataJson, userId) => {
  const pool = await poolConnect;
  const transaction = new sql.Transaction(pool);

  try {
    // 1. หาเจ้าของงานเพื่อเช็ค Level
    const submission = await submissionRepo.getSubmissionWithDetails(pool, id);
    if (!submission) throw new Error("Submission not found");

    const submittedBy = submission.submitted_by;
    const userLevel = await submissionRepo.getUserApprovalLevel(
      pool,
      submittedBy
    );

    // 2. คำนวณสถานะใหม่ (LV3 -> Approved, อื่นๆ -> Pending)
    const newStatus = userLevel >= 3 ? "Approved" : "Pending";

    await transaction.begin();

    // เรียก Helper Function ในไฟล์เดียวกัน
    const cleanedFormData = cleanSubmissionData(formDataJson);
    const keyMetrics = extractKeyMetrics(cleanedFormData);
    const formType = submission.form_type; // มีอยู่แล้วจาก getSubmissionWithDetails ข้างบน
    const lotNo = submission.lot_no; // ✅ Get Lot No for Logging
    const oldFormData = JSON.parse(submission.form_data_json || "{}"); // ✅ Get Old Data for Diff

    // 🔴 คำนวณ ST Value ใหม่ (Base + NCR)
    const finalStValue = await calculateTotalStValue(
      transaction,
      formType,
      keyMetrics.ncrGenmatsuActual
    );
    keyMetrics.stTargetValue = finalStValue;

    // 3. อัปเดตข้อมูล (ส่ง Status ใหม่ และ keyMetrics ที่มี productionLine ไปด้วย)
    await submissionRepo.resubmitSubmissionData(
      transaction,
      id,
      cleanedFormData,
      keyMetrics,
      newStatus
    );

    await transaction.commit();

    // ✅ Generate Diff Summary
    const changes = getObjectDiff(oldFormData, cleanedFormData);
    const changesText = changes.length > 0 ? ` Changes: ${changes.join(", ").substring(0, 500)}` : " (No content changes)";

    // ✅ Log Activity
    await activityLogRepo.createLog({
      userId: userId,
      actionType: 'RESUBMIT',
      targetModule: formType || 'Submission',
      targetId: id,
      details: `Resubmitted Lot No: ${lotNo}.${changesText}`
    });

    // 4. สร้าง Flow อนุมัติใหม่ (เฉพาะถ้าสถานะเป็น Pending)
    if (newStatus === "Pending") {
      await createApprovalFlow(pool, id, submittedBy);
    }
  } catch (error) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw error;
  }
};


exports.getMyMessages = async (userId) => {
  const pool = await poolConnect;
  const ironpowderRepo = require("../repositories/ironpowder.repository"); // ✅ Import

  // 1. ดึงข้อความจากงานปกติ
  const standardMessages = await submissionRepo.getRecentCommentsForUser(pool, userId);

  // 2. ดึงข้อความจากงาน Recycle
  let recycleMessages = [];
  try {
    recycleMessages = await ironpowderRepo.getRecentCommentsForUser(pool, userId);
  } catch (error) {
    console.error("Error fetching ironpowder messages:", error);
    // ไม่ throw error เพื่อให้งานปกติยังแสดงได้
  }

  // 3. รวมและเรียงลำดับตามเวลาล่าสุด (Action Date)
  const allMessages = [...standardMessages, ...recycleMessages].sort(
    (a, b) => new Date(b.action_date) - new Date(a.action_date)
  );

  // 4. ส่งกลับแค่ 10 รายการล่าสุด
  return allMessages.slice(0, 10);
};

// [ฟังก์ชันช่วย] ค้นหาค่าจาก Path (เหมือนเดิม)
const getNestedValue = (obj, path) => {
  return path
    .split(".")
    .reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : null),
      obj
    );
};

function extractKeyMetrics(formData) {
  // 1. กำหนดค่า Default
  let inputKg = 0;
  let outputKg = 0;
  let yieldPercent = 0;
  let totalQty = 0;
  let productionDate = null;
  let palletData = [];
  let productionLine = null;
  let moisture = null; // ✅ มารอรับค่า Moisture

  if (!formData)
    return {
      inputKg,
      outputKg,
      yieldPercent,
      totalQty,
      productionDate,
      palletData,
      productionLine,
      moisture,
    };

  // -----------------------------------------------------------
  // 2. ระบุเส้นทาง (Paths)
  // -----------------------------------------------------------

  const inputPaths = [
    "calculations.finalTotalWeight",
    "bs3Calculations.totalWeightWithNcr",
    "bz3Calculations.totalWeightWithNcr",
    "bz5cCalculations.totalWeightWithNcr",
    "bs5cCalculations.totalWeightWithNcr",
    "cg1cWeighting.total",
    "rc417Weighting.total",
    "rawMaterials.totalNetWeight",
  ];

  const outputPaths = [
    "packingResults.quantityOfProduct.calculated",
    "packingResults.yieldPercent",
  ];

  const yieldPaths = [
    "packingResults.yieldPercent",
    "calculations.yield",
    "operationResults.yieldPercent", // ✅ เปิดกลับมาตามที่คุณแจ้งว่าใช้ได้
  ];

  const qtyPaths = [
    "packingResults.quantityOfProduct.cans",
    "packingResults.quantityOfProduct.calculated",
    "basicData.outputQuantity",
  ];

  const datePaths = ["basicData.date"];
  const rawPallets = formData.palletInfo || [];
  const linePaths = ["basicData.machineName"];

  // -----------------------------------------------------------
  // 3. วนลูปหาค่า
  // -----------------------------------------------------------

  // หา Production Line
  for (const path of linePaths) {
    const val = getNestedValue(formData, path);
    if (val !== null && val !== undefined && val !== "") {
      productionLine = val.toString();
      break;
    }
  }

  // หา Input (Kg)
  for (const path of inputPaths) {
    const val = getNestedValue(formData, path);
    if (val !== null && val !== undefined && val !== "") {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        inputKg = parsed;
        break;
      }
    }
  }

  // หา Output (Kg)
  for (const path of outputPaths) {
    const val = getNestedValue(formData, path);
    if (val !== null && val !== undefined && val !== "") {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        outputKg = parsed;
        break;
      }
    }
  }

  // หาค่าอื่นๆ (Yield, Qty, Date)
  for (const path of yieldPaths) {
    const val = getNestedValue(formData, path);
    if (val != null && val !== "") {
      const p = parseFloat(val);
      if (!isNaN(p)) {
        yieldPercent = p;
        break;
      }
    }
  }
  for (const path of qtyPaths) {
    const val = getNestedValue(formData, path);
    if (val != null && val !== "") {
      const p = parseInt(val);
      if (!isNaN(p)) {
        totalQty = p;
        break;
      }
    }
  }
  for (const path of datePaths) {
    const val = getNestedValue(formData, path);
    if (val != null && val !== "") {
      productionDate = val;
      break;
    }
  }

  // 💧 Logic ใหม่: หา Moisture ใน Array operationResults
  if (Array.isArray(formData.operationResults)) {
    for (const item of formData.operationResults) {
      if (
        item &&
        item.humidity !== undefined &&
        item.humidity !== null &&
        item.humidity !== ""
      ) {
        const parsed = parseFloat(item.humidity);
        if (!isNaN(parsed)) {
          moisture = parsed;
          break;
        }
      }
    }
  }

  // 🔴 Logic ใหม่: หา NCR Genmatsu Actual
  let ncrGenmatsuActual = 0;
  const ncrVal = getNestedValue(formData, "rawMaterials.ncrGenmatsu.actual");
  if (ncrVal !== null && ncrVal !== undefined && ncrVal !== "") {
    const parsed = parseFloat(ncrVal);
    if (!isNaN(parsed)) {
      ncrGenmatsuActual = parsed;
    }
  }

  // หา Pallet Data
  if (Array.isArray(rawPallets)) {
    palletData = rawPallets
      .filter((item) => item.no && item.no.trim() !== "")
      .map((item) => ({
        no: item.no,
        qty: item.qty,
      }));
  }

  return {
    inputKg,
    outputKg,
    yieldPercent,
    totalQty,
    productionDate,
    palletData,
    productionLine,
    productionLine,
    moisture,
    ncrGenmatsuActual, // 🔴 เพิ่มค่านี้ส่งออกไป
  };
}

// 🔴 Helper Function: คำนวณ ST Value (Base Plan + NCR)
async function calculateTotalStValue(transaction, formType, ncrValue = 0) {
  const stPlanResult = await transaction
    .request()
    .input("f_type", sql.NVarChar, formType)
    .query(
      "SELECT target_value FROM Gen_StandardPlan_MT WHERE form_type = @f_type"
    );

  const baseStValue =
    stPlanResult.recordset.length > 0
      ? stPlanResult.recordset[0].target_value
      : 0;

  return baseStValue + ncrValue; // 🔴 บวก NCR เข้าไป
}
