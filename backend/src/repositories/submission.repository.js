const sql = require("mssql");
const dbConfig = require("../config/db.config");

// Helper to get a pool connection
const getPool = async () => await sql.connect(dbConfig);

exports.getUserApprovalLevel = async (pool, submittedBy) => {
  const request = new sql.Request(pool);
  const result = await request
    .input("submittedBy", sql.NVarChar, submittedBy)
    .query(
      "SELECT LV_Approvals FROM AGT_SMART_SY.dbo.Gen_Manu_Member WHERE Gen_Manu_mem_Memid = @submittedBy"
    );
  return result.recordset[0] ? result.recordset[0].LV_Approvals : null;
};

exports.createApprovalFlowSteps = async (
  transaction,
  submissionId,
  flowSteps
) => {
  const request = new sql.Request(transaction);
  const values = flowSteps
    .map(
      (step) => `(${submissionId}, ${step.sequence}, ${step.required_level})`
    )
    .join(", ");

  const query = `
    INSERT INTO Gen_Approval_Flow (submission_id, sequence, required_level)
    VALUES ${values}
  `;
  await request.query(query);
};

exports.getSubmissionWithDetails = async (pool, submissionId) => {
  const request = new sql.Request(pool);
  const result = await request.input("submissionId", sql.Int, submissionId)
    .query(`
      SELECT 
          fs.submission_id, 
          fs.version_set_id, 
          fs.form_type, 
          fs.lot_no,
          fs.submitted_by, 
          fs.submitted_at, 
          fs.status, 
          fsd.form_data_json,
          fsd.production_date, -- ✅ Added production_date
          u.agt_member_nameEN AS submitted_by_name,
          fvs.category -- ✅ Added category from join
      FROM Form_Submissions fs
      JOIN Form_Submission_Data fsd ON fs.submission_id = fsd.submission_id
      LEFT JOIN agt_member u ON fs.submitted_by COLLATE Thai_CI_AS = u.agt_member_id
      LEFT JOIN Form_Version_Sets fvs ON fs.version_set_id = fvs.version_set_id -- ✅ Join to get category
      WHERE fs.submission_id = @submissionId
    `);
  return result.recordset[0];
};

exports.getVersionSetItems = async (pool, versionSetId) => {
  const request = new sql.Request(pool);
  const result = await request.input("versionSetId", sql.Int, versionSetId)
    .query(`
      SELECT 
          fmt.template_id, fmt.template_name, fmt.template_category, fmt.version,
          fmi.item_id, fmi.display_order, fmi.config_json
      FROM Form_Version_Set_Items fvsi
      JOIN Form_Master_Templates fmt ON fvsi.template_id = fmt.template_id
      JOIN Form_Master_Items fmi ON fvsi.template_id = fmi.template_id
      WHERE fvsi.version_set_id = @versionSetId
      ORDER BY fmt.template_name, fmi.display_order
    `);
  return result.recordset;
};

exports.getTemplateCategory = async (transaction, templateId) => {
  const request = new sql.Request(transaction);
  const result = await request
    .input("firstTemplateId", sql.Int, templateId)
    .query(
      "SELECT template_category FROM Form_Master_Templates WHERE template_id = @firstTemplateId"
    );
  return result.recordset[0] ? result.recordset[0].template_category : null;
};

exports.findExistingVersionSet = async (transaction, category, templateIds) => {
  const findSetQuery = `
      SELECT vs.version_set_id
      FROM Form_Version_Sets vs
      WHERE vs.category = @categoryToUse AND vs.is_latest = 1
        AND (SELECT COUNT(DISTINCT vsi.template_id) FROM Form_Version_Set_Items vsi WHERE vsi.version_set_id = vs.version_set_id) = @templateCount
        AND NOT EXISTS (
          SELECT 1
          FROM (VALUES ${templateIds.map((id) => `(${id})`).join(",")}) AS t(id)
          WHERE t.id NOT IN (SELECT vsi.template_id FROM Form_Version_Set_Items vsi WHERE vsi.version_set_id = vs.version_set_id)
        )
    `;
  const request = new sql.Request(transaction);
  const result = await request
    .input("categoryToUse", sql.NVarChar, category)
    .input("templateCount", sql.Int, templateIds.length)
    .query(findSetQuery);
  return result.recordset[0] ? result.recordset[0].version_set_id : null;
};

exports.deprecateOldVersionSet = async (transaction, category) => {
  const request = new sql.Request(transaction);
  await request
    .input("categoryToUse", sql.NVarChar, category)
    .query(
      "UPDATE Form_Version_Sets SET is_latest = 0 WHERE category = @categoryToUse AND is_latest = 1"
    );
};

exports.createNewVersionSet = async (transaction, category) => {
  const getNewVersionRequest = new sql.Request(transaction);
  const lastVersionResult = await getNewVersionRequest
    .input("categoryToUse", sql.NVarChar, category)
    .query(
      "SELECT ISNULL(MAX(version), 0) as lastVersion FROM Form_Version_Sets WHERE category = @categoryToUse"
    );
  const newVersion = lastVersionResult.recordset[0].lastVersion + 1;

  const createSetRequest = new sql.Request(transaction);
  const newSetResult = await createSetRequest
    .input("categoryToUse", sql.NVarChar, category)
    .input("newVersion", sql.Int, newVersion)
    .query(
      "INSERT INTO Form_Version_Sets (category, version, is_latest) OUTPUT INSERTED.version_set_id VALUES (@categoryToUse, @newVersion, 1)"
    );
  return newSetResult.recordset[0].version_set_id;
};

exports.addItemsToVersionSet = async (
  transaction,
  versionSetId,
  templateIds
) => {
  for (const templateId of templateIds) {
    const request = new sql.Request(transaction);
    await request
      .input("versionSetId", sql.Int, versionSetId)
      .input("templateId", sql.Int, templateId)
      .query(
        "INSERT INTO Form_Version_Set_Items (version_set_id, template_id) VALUES (@versionSetId, @templateId)"
      );
  }
};

exports.createSubmissionRecord = async (transaction, data) => {
  // 🟡 รับ status เข้ามา
  const { versionSetId, formType, lotNo, submittedBy, productionLine, status } =
    data;

  const request = new sql.Request(transaction);
  const result = await request
    .input("versionSetId", sql.Int, versionSetId)
    .input("formType", sql.NVarChar, formType)
    .input("lotNo", sql.NVarChar, lotNo)
    .input("submittedBy", sql.NVarChar, submittedBy)
    .input("productionLine", sql.NVarChar, productionLine || null)
    .input("status", sql.NVarChar, status || "Pending") // 🟡 เพิ่ม Input นี้ (Default Pending)
    .query(`
        INSERT INTO Form_Submissions 
          (version_set_id, form_type, lot_no, submitted_by, production_line, status) -- เพิ่ม status
        OUTPUT INSERTED.submission_id 
        VALUES 
          (@versionSetId, @formType, @lotNo, @submittedBy, @productionLine, @status) -- เพิ่ม @status
      `);
  return result.recordset[0].submission_id;
};

exports.createSubmissionData = async (
  transaction,
  submissionId,
  formData,
  keyMetrics
) => {
  const request = new sql.Request(transaction);

  await request
    .input("submissionId", sql.Int, submissionId)
    .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData))
    // [New Columns]
    .input("inputKg", sql.Decimal(10, 2), keyMetrics.inputKg || null)
    .input("outputKg", sql.Decimal(10, 2), keyMetrics.outputKg || null)
    .input("yieldPercent", sql.Decimal(5, 2), keyMetrics.yieldPercent || null)
    .input("totalQty", sql.Int, keyMetrics.totalQty || null)
    .input("productionDate", sql.Date, keyMetrics.productionDate || null)
    .input("stTargetValue", sql.Decimal(10, 2), keyMetrics.stTargetValue || 0)
    // 💧 1. เพิ่ม Input Moisture ตรงนี้
    .input("moisture", sql.Decimal(5, 2), keyMetrics.moisture || null)
    .input(
      "palletData",
      sql.NVarChar(sql.MAX),
      JSON.stringify(keyMetrics.palletData || [])
    ).query(`
        INSERT INTO Form_Submission_Data 
        (
            submission_id, 
            form_data_json, 
            input_kg, 
            output_kg, 
            yield_percent, 
            total_qty, 
            production_date,
            st_target_value,
            moisture, -- 💧 2. เพิ่มชื่อ Column ใน SQL
            pallet_data
        ) 
        VALUES 
        (
            @submissionId, 
            @formDataJson, 
            @inputKg, 
            @outputKg, 
            @yieldPercent, 
            @totalQty, 
            @productionDate,
            @stTargetValue,
            @moisture, -- 💧 3. เพิ่ม Parameter @moisture
            @palletData
        )
      `);
};

exports.getAllSubmissions = async (pool, params) => {
  const { page, pageSize, search, startDate, endDate, status, formType, category, user } = params;
  const offset = (page - 1) * pageSize;

  const request = new sql.Request(pool);

  let conditions = [];

  if (category) {
    request.input('category', sql.NVarChar, category);
    conditions.push("fvs.category = @category");
  }

  if (search) {
    request.input('search', sql.NVarChar, `%${search}%`);
    conditions.push("(fs.lot_no LIKE @search OR u.agt_member_nameEN LIKE @search)");
  }

  if (user) {
    request.input('user', sql.NVarChar, `%${user}%`);
    conditions.push("(u.agt_member_nameEN LIKE @user OR fs.submitted_by LIKE @user)");
  }

  // Validate dates before adding to query
  if (startDate && startDate !== 'null' && endDate && endDate !== 'null') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      request.input('startDate', sql.Date, startDate);
      request.input('endDate', sql.Date, endDate);
      conditions.push("fsd.production_date BETWEEN @startDate AND @endDate");
    }
  }

  if (status) {
    request.input('status', sql.NVarChar, status);
    conditions.push("fs.status = @status");
  }

  if (formType) {
    request.input('formType', sql.NVarChar, formType);
    conditions.push("fs.form_type = @formType");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 1. Get Total Count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM Form_Submissions fs
    JOIN Form_Submission_Data fsd ON fs.submission_id = fsd.submission_id
    LEFT JOIN agt_member u ON fs.submitted_by COLLATE Thai_CI_AS = u.agt_member_id
    LEFT JOIN Form_Version_Sets fvs ON fs.version_set_id = fvs.version_set_id
    ${whereClause}
  `;
  const countResult = await request.query(countQuery);
  const total = countResult.recordset[0].total;

  // 2. Get Data with Pagination
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, pageSize);

  const dataQuery = `
    SELECT 
        fs.submission_id, 
        fs.form_type, 
        fs.lot_no,
        fs.submitted_by, 
       -- fs.submitted_at, 
        fs.status, 
        fsd.production_date,
       -- fsd.input_kg,
       -- fsd.output_kg,
       -- fsd.yield_percent,
       -- fsd.total_qty,
        u.agt_member_nameEN AS submitted_by_name,
        (
            SELECT TOP 1 required_level 
            FROM Gen_Approval_Flow 
            WHERE submission_id = fs.submission_id AND status = 'Pending' 
            ORDER BY sequence ASC
        ) AS pending_level
    FROM Form_Submissions fs
    JOIN Form_Submission_Data fsd ON fs.submission_id = fsd.submission_id
    LEFT JOIN agt_member u ON fs.submitted_by COLLATE Thai_CI_AS = u.agt_member_id
    LEFT JOIN Form_Version_Sets fvs ON fs.version_set_id = fvs.version_set_id
    ${whereClause}
    ORDER BY fs.submission_id DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  const dataResult = await request.query(dataQuery);

  return {
    data: dataResult.recordset,
    total: total
  };
};

exports.getPendingSubmissionsByLevel = async (pool, userLevel) => {
  try {
    const result = await pool.request().input("userLevel", sql.Int, userLevel)
      .query(`
        SELECT 
          s.submission_id, -- ⚠️ แก้ s.id เป็น s.submission_id ให้ตรงกับตารางจริง (ถ้าตารางคุณใช้ submission_id)
          s.lot_no,
          s.submitted_by,
          u.agt_member_nameEN AS submitted_by_name, -- ⚠️ แก้ u.username เป็น u.agt_member_nameEN ตาม query บนๆ
          s.form_type, -- ✅ เพิ่ม form_type
          s.submitted_at AS created_at, -- ⚠️ แก้ s.created_at เป็น s.submitted_at
          s.status,
          (
            SELECT TOP 1 required_level 
            FROM Gen_Approval_Flow 
            WHERE submission_id = s.submission_id AND status = 'Pending' 
            ORDER BY sequence ASC
          ) AS pending_level
        FROM Form_Submissions s
        LEFT JOIN agt_member u ON s.submitted_by COLLATE Thai_CI_AS = u.agt_member_id
        WHERE s.status = 'Pending' 
          -- Logic กรอง Level (เช็คจาก Subquery ด้านบน หรือ Join Gen_Approval_Flow เพิ่ม)
          AND (
            SELECT TOP 1 required_level 
            FROM Gen_Approval_Flow 
            WHERE submission_id = s.submission_id AND status = 'Pending' 
            ORDER BY sequence ASC
          ) = @userLevel
        ORDER BY s.submitted_at DESC
      `);


    return result.recordset;
  } catch (error) {
    console.error("Error fetching pending submissions:", error);
    throw error;
  }
};

exports.getRejectedSubmissionsByUser = async (pool, userId) => {
  try {
    const result = await pool.request().input("userId", sql.NVarChar, userId)
      .query(`
        SELECT 
          s.submission_id,
          s.lot_no,
          s.submitted_by,
          u.agt_member_nameEN AS submitted_by_name,
          s.form_type, -- ✅ เพิ่ม form_type
          s.submitted_at AS created_at,
          s.status,
          'Rejected' AS pending_level -- Dummy field for consistency
        FROM Form_Submissions s
        LEFT JOIN agt_member u ON s.submitted_by COLLATE Thai_CI_AS = u.agt_member_id
        WHERE s.submitted_by COLLATE Thai_CI_AS = @userId 
          AND s.status = 'Rejected'
        ORDER BY s.submitted_at DESC
      `);
    return result.recordset;
  } catch (error) {
    console.error("Error fetching rejected submissions:", error);
    throw error;
  }
};

exports.deleteSubmissionRelatedData = async (transaction, submissionId) => {
  const request = new sql.Request(transaction);
  request.input("submissionId", sql.Int, submissionId);

  await request.query(
    "DELETE FROM Gen_Approval_Flow WHERE submission_id = @submissionId"
  );
  await request.query(
    "DELETE FROM Gen_Approved_log WHERE submission_id = @submissionId"
  );
  await request.query(
    "DELETE FROM Form_Submission_Data WHERE submission_id = @submissionId"
  );
  const result = await request.query(
    "DELETE FROM Form_Submissions WHERE submission_id = @submissionId"
  );

  return result.rowsAffected[0] > 0;
};

exports.updateSubmissionRecord = async (
  transaction,
  submissionId,
  lotNo,
  productionLine
) => {
  const request = new sql.Request(transaction);
  await request
    .input("submission_id", sql.Int, submissionId)
    .input("production_line", sql.NVarChar, productionLine || null)
    .input("lot_no", sql.NVarChar, lotNo).query(`
        UPDATE Form_Submissions
        SET lot_no = @lot_no,
        production_line = @production_line,
            submitted_at = GETDATE()
        WHERE submission_id = @submission_id;
      `);
};

exports.updateSubmissionData = async (
  transaction,
  submissionId,
  formData,
  keyMetrics
) => {
  const request = new sql.Request(transaction);

  await request
    .input("submission_id", sql.Int, submissionId)
    .input("form_data_json", sql.NVarChar(sql.MAX), JSON.stringify(formData))
    // [New Columns]
    .input("inputKg", sql.Decimal(10, 2), keyMetrics.inputKg || null)
    .input("outputKg", sql.Decimal(10, 2), keyMetrics.outputKg || null)
    .input("yieldPercent", sql.Decimal(5, 2), keyMetrics.yieldPercent || null)
    .input("totalQty", sql.Int, keyMetrics.totalQty || null)
    .input("productionDate", sql.Date, keyMetrics.productionDate || null)
    .input("stTargetValue", sql.Decimal(10, 2), keyMetrics.stTargetValue || 0) // 🔴 เพิ่ม Input
    // 💧 5. เพิ่ม Input Moisture ตอนแก้ไข
    .input("moisture", sql.Decimal(5, 2), keyMetrics.moisture || null)
    .input(
      "palletData",
      sql.NVarChar(sql.MAX),
      JSON.stringify(keyMetrics.palletData || [])
    ).query(`
        UPDATE Form_Submission_Data
        SET 
            form_data_json = @form_data_json,
            input_kg = @inputKg,
            output_kg = @outputKg,
            yield_percent = @yieldPercent,
            total_qty = @totalQty,
            production_date = @productionDate,
            st_target_value = @stTargetValue, -- 🔴 เพิ่มการอัปเดต ST Value
            moisture = @moisture, -- 💧 6. เพิ่มการอัปเดต Field Moisture
            pallet_data = @palletData
        WHERE submission_id = @submission_id;
      `);
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
  request.input("stTargetValue", sql.Decimal(10, 2), keyMetrics.stTargetValue || 0); // 🔴 เพิ่ม Input
  // 💧 7. เพิ่ม Input Moisture ตอน Resubmit
  request.input("moisture", sql.Decimal(5, 2), keyMetrics.moisture || null);
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
            st_target_value = @stTargetValue, -- 🔴 เพิ่มการอัปเดต ST Value
            moisture = @moisture, -- 💧 8. เพิ่มการอัปเดต Field Moisture
            pallet_data = @palletData
          WHERE submission_id = @submissionId
      `);

  // 3.2 Update Submission Header (เหมือนเดิม)
  await request.query(`
          UPDATE Form_Submissions 
          SET 
              submitted_at = GETDATE(),
              status = @status,
              production_line = @productionLine
          WHERE 
              submission_id = @submissionId
              AND (status = 'Rejected' OR status = 'Draft')
      `);

  // 3.3, 3.4 (ลบ Flow, Log เหมือนเดิม)
  await request.query(`
      DELETE FROM Gen_Approval_Flow WHERE submission_id = @submissionId
  `);
  await request.query(`
          DELETE FROM AGT_SMART_SY.dbo.Gen_Approved_log
          WHERE submission_id = @submissionId AND action = 'Rejected' 
      `);
};

exports.getRecentCommentsForUser = async (pool, userId) => {
  try {
    const result = await pool.request().input("userId", sql.NVarChar, userId)
      .query(`
        SELECT TOP 10
          l.log_id,
          l.submission_id,
          l.comment,
          l.action, 
          l.created_at AS action_date,
          s.lot_no,
          u.agt_member_nameEN AS commenter_name,
          l.User_approver_id,
          'General' AS category -- ✅ Mark as General
        FROM AGT_SMART_SY.dbo.Gen_Approved_log l
        JOIN Form_Submissions s ON l.submission_id = s.submission_id
        LEFT JOIN AGT_SMART_SY.dbo.agt_member u 
          ON l.User_approver_id COLLATE Thai_CI_AS = u.agt_member_id COLLATE Thai_CI_AS 
        WHERE s.submitted_by COLLATE Thai_CI_AS = @userId 
          AND l.comment IS NOT NULL 
          AND l.comment != '' 
          AND l.User_approver_id COLLATE Thai_CI_AS != @userId 
        ORDER BY l.created_at DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};

exports.resetRejectionStatus = async (transaction, submissionId) => {
  const request = new sql.Request(transaction);
  request.input("submissionId", sql.Int, submissionId);

  // 1. เปลี่ยนสถานะเอกสารหลัก (Form_Submissions) จาก Rejected -> Pending
  await request.query(`
    UPDATE Form_Submissions
    SET status = 'Pending', submitted_at = GETDATE()
    WHERE submission_id = @submissionId AND status = 'Rejected'
  `);

  // 2. รีเซ็ต Flow การอนุมัติ (ให้กลับมารออนุมัติใหม่ทั้งหมด)
  // เฉพาะถ้าเอกสารหลักเป็น Pending (ซึ่งเราเพิ่งอัปเดตไปข้างบน) หรือ Rejected
  await request.query(`
    UPDATE Gen_Approval_Flow
    SET status = 'Pending', approver_user_id = NULL, updated_at = NULL
    WHERE submission_id = @submissionId
      AND EXISTS (SELECT 1 FROM Form_Submissions WHERE submission_id = @submissionId AND status = 'Pending')
  `);

  // 3. ลบประวัติการ Reject (Log) เพื่อให้คอมเมนต์สีแดงหายไป
  await request.query(`
    DELETE FROM AGT_SMART_SY.dbo.Gen_Approved_log
    WHERE submission_id = @submissionId AND action = 'Rejected'
  `);
};
