const sql = require('mssql');
const dbConfig = require('../config/db.config');

exports.createSubmission = async (req, res) => {
  const { formType, lotNo, templateIds, formData, submittedBy } = req.body;

  // ตรวจสอบข้อมูลเบื้องต้น
  if (!formType || !templateIds || !formData) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // -- Logic การหาหรือสร้าง Version Set --
    let versionSetId;

    // สร้าง Query สำหรับค้นหา version set ที่มี template id ตรงกันทั้งหมด
    const findSetQuery = `
      SELECT vs.version_set_id
      FROM Form_Version_Sets vs
      WHERE vs.category = @formType AND vs.is_latest = 1
        AND (SELECT COUNT(DISTINCT vsi.template_id) FROM Form_Version_Set_Items vsi WHERE vsi.version_set_id = vs.version_set_id) = @templateCount
        AND NOT EXISTS (
          SELECT 1
          FROM (VALUES ${templateIds.map(id => `(${id})`).join(',')}) AS t(id)
          WHERE t.id NOT IN (SELECT vsi.template_id FROM Form_Version_Set_Items vsi WHERE vsi.version_set_id = vs.version_set_id)
        )
    `;
    
    const findSetRequest = new sql.Request(transaction);
    const existingSet = await findSetRequest
      .input('formType', sql.NVarChar, formType)
      .input('templateCount', sql.Int, templateIds.length)
      .query(findSetQuery);

    if (existingSet.recordset.length > 0) {
      versionSetId = existingSet.recordset[0].version_set_id;
    } else {
      // ถ้าไม่เจอ ให้ปิด is_latest ของเวอร์ชันเก่า (ถ้ามี)
      const updateOldSetRequest = new sql.Request(transaction);
      await updateOldSetRequest
        .input('formType', sql.NVarChar, formType)
        .query('UPDATE Form_Version_Sets SET is_latest = 0 WHERE category = @formType AND is_latest = 1');
      
      // สร้าง version set ใหม่
      const getNewVersionRequest = new sql.Request(transaction);
      const lastVersionResult = await getNewVersionRequest
          .input('formType', sql.NVarChar, formType)
          .query('SELECT ISNULL(MAX(version), 0) as lastVersion FROM Form_Version_Sets WHERE category = @formType');
      const newVersion = lastVersionResult.recordset[0].lastVersion + 1;

      const createSetRequest = new sql.Request(transaction);
      const newSetResult = await createSetRequest
          .input('formType', sql.NVarChar, formType)
          .input('newVersion', sql.Int, newVersion)
          .query('INSERT INTO Form_Version_Sets (category, version, is_latest) OUTPUT INSERTED.version_set_id VALUES (@formType, @newVersion, 1)');
      versionSetId = newSetResult.recordset[0].version_set_id;

      // เพิ่ม items เข้าไปใน version set ใหม่
      for (const templateId of templateIds) {
          const createSetItemRequest = new sql.Request(transaction);
          await createSetItemRequest
              .input('versionSetId', sql.Int, versionSetId)
              .input('templateId', sql.Int, templateId)
              .query('INSERT INTO Form_Version_Set_Items (version_set_id, template_id) VALUES (@versionSetId, @templateId)');
      }
    }
    
    // -- บันทึกข้อมูล Submission --
    const submissionRequest = new sql.Request(transaction);
    const submissionResult = await submissionRequest
      .input('versionSetId', sql.Int, versionSetId)
      .input('formType', sql.NVarChar, formType)
      .input('lotNo', sql.NVarChar, lotNo)
      .input('submittedBy', sql.NVarChar, submittedBy)
      .query(`
        INSERT INTO Form_Submissions (version_set_id, form_type, lot_no, submitted_by) 
        OUTPUT INSERTED.submission_id 
        VALUES (@versionSetId, @formType, @lotNo, @submittedBy)
      `);
    const submissionId = submissionResult.recordset[0].submission_id;

    // -- บันทึกข้อมูล Form Data (JSON) --
    const dataRequest = new sql.Request(transaction);
    await dataRequest
      .input('submissionId', sql.Int, submissionId)
      .input('formDataJson', sql.NVarChar(sql.MAX), JSON.stringify(formData))
      .query(`
        INSERT INTO Form_Submission_Data (submission_id, form_data_json) 
        VALUES (@submissionId, @formDataJson)
      `);
      
    await transaction.commit();
    res.status(201).send({ message: 'Form submitted successfully!', submissionId: submissionId });

  } catch (err) {
    await transaction.rollback();
    res.status(500).send({ message: "Failed to submit form.", error: err.message });
  }
};