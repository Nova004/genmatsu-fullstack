const { sql, poolConnect } = require("../db"); // ✅ 1. เรียกใช้ poolConnect จากไฟล์กลาง
const submissionRepo = require("../repositories/submission.repository");

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

exports.createSubmission = async (data) => {
  const { formType, lotNo, templateIds, formData, submittedBy } = data; // 👈 บรรทัดเดิม
  const cleanedFormData = cleanSubmissionData(formData);
  const pool = await poolConnect; // ✅ ใช้ Pool กลาง
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

    // 3. Insert Submission
    const submissionId = await submissionRepo.createSubmissionRecord(
      transaction,
      {
        versionSetId,
        formType,
        lotNo,
        submittedBy,
      }
    );

    // 4. Insert Form Data
    const keyMetrics = extractKeyMetrics(cleanedFormData);

    // 4. Insert Form Data (ส่ง keyMetrics ไปด้วย)
    await submissionRepo.createSubmissionData(
      transaction,
      submissionId,
      cleanedFormData, // 👈 ✅ แก้เป็น cleanedFormData (ตัวที่ล้างแล้ว)
      keyMetrics
    );

    await transaction.commit();

    // Create Approval Flow (Separate transaction/logic)
    // ส่ง pool กลางเข้าไป
    await createApprovalFlow(pool, submissionId, submittedBy);

    return submissionId;
  } catch (error) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw error;
  } finally {
    // ✅ ลบ pool.close() ออก
  }
};

exports.getAllSubmissions = async (category) => {
  const pool = await poolConnect; // ✅ ใช้ Pool กลาง
  try {
    return await submissionRepo.getAllSubmissions(pool, category);
  } finally {
    // ✅ ลบ pool.close() ออก
  }
};

exports.getSubmissionById = async (id) => {
  return await this.getSubmissionDataForPdf(id);
};

exports.deleteSubmission = async (id) => {
  const pool = await poolConnect; // ✅ ใช้ Pool กลาง
  const transaction = new sql.Transaction(pool);

  try {
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

exports.updateSubmission = async (id, lot_no, form_data) => {
  const pool = await poolConnect;
  const transaction = new sql.Transaction(pool);

  try {
    console.log(`🔥 [DEBUG] updateSubmission called for ID: ${id}`);

    await transaction.begin();

    const cleanedFormData = cleanSubmissionData(form_data);
    const keyMetrics = extractKeyMetrics(cleanedFormData);

    // 1. อัปเดตข้อมูลปกติ
    await submissionRepo.updateSubmissionRecord(transaction, id, lot_no);
    await submissionRepo.updateSubmissionData(
      transaction,
      id,
      cleanedFormData,
      keyMetrics
    );


    await transaction.commit();
    console.log("✅ [DEBUG] Update & Reset Transaction Committed!");
  } catch (err) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    console.error("❌ [DEBUG] Error:", err);
    throw err;
  }
};

exports.getMyPendingTasks = async (userLevel) => {
  const pool = await poolConnect;
  // เรียกใช้ Repository ตัวใหม่ที่สร้างตะกี้
  return await submissionRepo.getPendingSubmissionsByLevel(pool, userLevel);
};

exports.resubmitSubmission = async (id, formDataJson) => {
  const pool = await poolConnect; // ✅ ใช้ Pool กลาง
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const cleanedFormData = cleanSubmissionData(formDataJson);

    // ⚠️ แก้จุดนี้: ใช้ cleanedFormData
    const keyMetrics = extractKeyMetrics(cleanedFormData);

    await submissionRepo.resubmitSubmissionData(
      transaction,
      id,
      cleanedFormData,
      keyMetrics
    );

    await transaction.commit();
  } catch (error) {
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    throw error;
  } finally {
    // ✅ ลบ pool.close() ออก
  }
};

exports.getMyMessages = async (userId) => {
  const pool = await poolConnect;
  return await submissionRepo.getRecentCommentsForUser(pool, userId);
};

function cleanSubmissionData(data) {
  if (!data) return data;

  // Clone ข้อมูลเพื่อความปลอดภัย
  const cleaned = JSON.parse(JSON.stringify(data));

  // ฟังก์ชันช่วยเช็คว่าเป็น "ค่าว่าง" หรือไม่
  const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0
    )
      return true; // Object ว่าง {}
    return false;
  };

  // 1. กรอง Array หลักๆ (เฉพาะอันที่ User ยอมให้ลบแถวได้)
  if (Array.isArray(cleaned.mcOperators)) {
    cleaned.mcOperators = cleaned.mcOperators.filter(
      (item) => item.id && item.id.toString().trim() !== ""
    );
  }

  if (Array.isArray(cleaned.assistants)) {
    cleaned.assistants = cleaned.assistants.filter(
      (item) => item.id && item.id.toString().trim() !== ""
    );
  }

  if (Array.isArray(cleaned.palletInfo)) {
    cleaned.palletInfo = cleaned.palletInfo.filter(
      (item) => item.no && item.no.toString().trim() !== ""
    );
  }

  // 2. ฟังก์ชันวนลูปทำความสะอาด (Recursive)
  const deepClean = (obj) => {
    if (Array.isArray(obj)) {
      // ⚠️ ปกติ: ล้างไส้ใน แล้วกรองตัวว่างทิ้ง (Filter)
      return obj
        .map((item) => deepClean(item))
        .filter((item) => !isEmpty(item));
    } else if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((key) => {
        const val = obj[key];

        // Trim String ถ้ามี
        if (typeof val === "string") {
          obj[key] = val.trim();
        }

        // ⭐ จุดแก้สำคัญ: ถ้าเป็น operationResults ห้าม Filter แถวทิ้ง!
        if (key === "operationResults" && Array.isArray(obj[key])) {
          // เข้าไป clean ไส้ในเฉยๆ (Map) แต่ไม่ Filter
          obj[key] = obj[key].map((item) => deepClean(item));
        } else {
          // กรณีอื่นๆ (เช่น rawMaterials) ให้ clean ตามปกติ
          obj[key] = deepClean(obj[key]);

          // ถ้า clean แล้วว่าง ให้ลบ Key ทิ้ง
          if (isEmpty(obj[key])) {
            delete obj[key];
          }
        }
      });
    }
    return obj;
  };

  return deepClean(cleaned);
}

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
  let palletData = []; // [ใหม่] เตรียม Array ว่างไว้

  if (!formData)
    return {
      inputKg,
      outputKg,
      yieldPercent,
      totalQty,
      productionDate,
      palletData,
    };

  // -----------------------------------------------------------
  // 2. ระบุเส้นทาง (Paths)
  // -----------------------------------------------------------

  // กลุ่ม: Input (Kg) - ใช้ Logic เดิมของ Total Weight
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

  // กลุ่ม: Output (Kg) - [ใหม่] ตามที่คุณระบุ
  const outputPaths = [
    "packingResults.quantityOfProduct.calculated", // ลองหาค่า Calculated ก่อน (น่าจะเป็น Kg)
    "packingResults.yieldPercent", // ถ้าไม่มี ให้เอา Yield Percent (ตามที่คุณแจ้ง)
  ];

  // กลุ่มอื่นๆ (คงเดิม)
  const yieldPaths = [
    "packingResults.yieldPercent",
    "calculations.yield",
    "operationResults.yieldPercent",
  ];
  const qtyPaths = [
    "packingResults.quantityOfProduct.cans",
    "packingResults.quantityOfProduct.calculated",
    "basicData.outputQuantity",
  ];
  const datePaths = ["basicData.date"];
  const rawPallets = formData.palletInfo || [];
  // -----------------------------------------------------------
  // 3. วนลูปหาค่า
  // -----------------------------------------------------------

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

  // หาค่าอื่นๆ (Yield, Qty, Date) - เหมือนเดิม
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
    palletData, // 👈 อย่าลืมตัวนี้ครับ!
  };
}
