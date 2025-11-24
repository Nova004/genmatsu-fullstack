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

exports.createApprovalFlowSteps = async (transaction, submissionId, flowSteps) => {
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
  const result = await request.input("submissionId", sql.Int, submissionId).query(`
      SELECT 
          fs.submission_id, fs.version_set_id, fs.form_type, fs.lot_no,
          fs.submitted_by, fs.submitted_at, fsd.form_data_json,
          u.agt_member_nameEN AS submitted_by_name
      FROM Form_Submissions fs
      JOIN Form_Submission_Data fsd ON fs.submission_id = fsd.submission_id
      LEFT JOIN
          agt_member u ON fs.submitted_by COLLATE Thai_CI_AS = u.agt_member_id
      WHERE fs.submission_id = @submissionId
    `);
  return result.recordset[0];
};

exports.getVersionSetItems = async (pool, versionSetId) => {
  const request = new sql.Request(pool);
  const result = await request.input("versionSetId", sql.Int, versionSetId).query(`
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

exports.addItemsToVersionSet = async (transaction, versionSetId, templateIds) => {
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
  const { versionSetId, formType, lotNo, submittedBy } = data;
  const request = new sql.Request(transaction);
  const result = await request
    .input("versionSetId", sql.Int, versionSetId)
    .input("formType", sql.NVarChar, formType)
    .input("lotNo", sql.NVarChar, lotNo)
    .input("submittedBy", sql.NVarChar, submittedBy).query(`
        INSERT INTO Form_Submissions (version_set_id, form_type, lot_no, submitted_by) 
        OUTPUT INSERTED.submission_id 
        VALUES (@versionSetId, @formType, @lotNo, @submittedBy)
      `);
  return result.recordset[0].submission_id;
};

exports.createSubmissionData = async (transaction, submissionId, formData) => {
  const request = new sql.Request(transaction);
  await request
    .input("submissionId", sql.Int, submissionId)
    .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData))
    .query(`
        INSERT INTO Form_Submission_Data (submission_id, form_data_json) 
        VALUES (@submissionId, @formDataJson)
      `);
};

exports.getAllSubmissions = async (pool, category) => {
  let baseQuery = `
            SELECT 
                fs.submission_id, fs.form_type, fs.lot_no, fs.submitted_at, fs.status,
                fs.submitted_by,
                fvs.category
            FROM 
                Form_Submissions AS fs
            LEFT JOIN 
                Form_Version_Sets AS fvs ON fs.version_set_id = fvs.version_set_id
        `;

  const request = pool.request();

  if (category) {
    baseQuery += ` WHERE fvs.category = @category`;
    request.input("category", sql.NVarChar, category);
  }

  baseQuery += ` ORDER BY fs.submitted_at DESC`;

  const result = await request.query(baseQuery);
  return result.recordset;
};

exports.deleteSubmissionRelatedData = async (transaction, submissionId) => {
  const request = new sql.Request(transaction);
  request.input("submissionId", sql.Int, submissionId);

  await request.query("DELETE FROM Gen_Approval_Flow WHERE submission_id = @submissionId");
  await request.query("DELETE FROM Gen_Approved_log WHERE submission_id = @submissionId");
  await request.query("DELETE FROM Form_Submission_Data WHERE submission_id = @submissionId");
  const result = await request.query("DELETE FROM Form_Submissions WHERE submission_id = @submissionId");
  
  return result.rowsAffected[0] > 0;
};

exports.updateSubmissionRecord = async (transaction, submissionId, lotNo) => {
  const request = new sql.Request(transaction);
  await request
    .input("submission_id", sql.Int, submissionId)
    .input("lot_no", sql.NVarChar, lotNo).query(`
        UPDATE Form_Submissions
        SET lot_no = @lot_no,
            submitted_at = GETDATE()
        WHERE submission_id = @submission_id;
      `);
};

exports.updateSubmissionData = async (transaction, submissionId, formData) => {
  const request = new sql.Request(transaction);
  await request
    .input("submission_id", sql.Int, submissionId)
    .input("form_data_json", sql.NVarChar, JSON.stringify(formData))
    .query(`
        UPDATE Form_Submission_Data
        SET form_data_json = @form_data_json
        WHERE submission_id = @submission_id;
      `);
};

exports.resubmitSubmissionData = async (transaction, submissionId, formDataJson) => {
  const request = new sql.Request(transaction);
  request.input("submissionId", sql.Int, submissionId);
  request.input("formDataJson", sql.NVarChar, JSON.stringify(formDataJson));

  await request.query(`
          UPDATE Form_Submission_Data 
          SET form_data_json = @formDataJson 
          WHERE submission_id = @submissionId
      `);

  await request.query(`
          UPDATE Form_Submissions 
          SET 
              submitted_at = GETDATE(),
              status = 'Drafted'
          WHERE 
              submission_id = @submissionId
              AND status = 'Rejected'
      `);

  await request.query(`
          UPDATE Gen_Approval_Flow 
          SET 
              status = 'Pending', 
              approver_user_id = NULL, 
              updated_at = NULL 
          WHERE 
              submission_id = @submissionId
              AND (status = 'Rejected' OR status = 'Pending')
      `);

  await request.query(`
          DELETE FROM AGT_SMART_SY.dbo.Gen_Approved_log
          WHERE 
              submission_id = @submissionId
              AND action = 'Rejected' 
      `);
};
