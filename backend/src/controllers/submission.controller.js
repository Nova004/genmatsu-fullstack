// controllers/submission.controller.js

const sql = require("mssql");
const dbConfig = require("../config/db.config");
const puppeteer = require("puppeteer");

async function getSubmissionDataForPdf(submissionId) {
  // สร้าง pool ใหม่เพื่อความปลอดภัย
  const pool = await sql.connect(dbConfig);
  const request = new sql.Request(pool);

  console.log(`[PDF-Helper] Fetching submission data for ID: ${submissionId}`);
  // 1. ดึงข้อมูลหลัก
  // 1. ดึงข้อมูลหลัก (‼️ [แก้ไข Query นี้] ‼️)
  const submissionResult = await request.input(
    "submissionId",
    sql.Int,
    submissionId
  ).query(`
      SELECT 
          fs.submission_id, fs.version_set_id, fs.form_type, fs.lot_no,
          fs.submitted_by, fs.submitted_at, fsd.form_data_json,

          -- 1. [เพิ่ม] เลือกคอลัมน์ชื่อจากตาราง agt_member
          u.agt_member_nameEN AS submitted_by_name

      FROM Form_Submissions fs
      JOIN Form_Submission_Data fsd ON fs.submission_id = fsd.submission_id

      -- 2. [เพิ่ม] JOIN ตาราง agt_member และแก้ Collation
      LEFT JOIN
          agt_member u ON fs.submitted_by COLLATE Thai_CI_AS = u.agt_member_id

      WHERE fs.submission_id = @submissionId
    `);

  if (submissionResult.recordset.length === 0) {
    console.error(`[PDF-Helper] Submission not found: ${submissionId}`);
    throw new Error("Submission not found.");
  }

  const submissionData = submissionResult.recordset[0];
  const versionSetId = submissionData.version_set_id;

  console.log(
    `[PDF-Helper] Fetching blueprints for VersionSetID: ${versionSetId}`
  );
  // 2. ดึงพิมพ์เขียว
  const blueprintResult = await new sql.Request(pool) // ⭐️ ใช้ pool เดิมได้
    .input("versionSetId", sql.Int, versionSetId).query(`
      SELECT 
          fmt.template_id, fmt.template_name, fmt.template_category, fmt.version,
          fmi.item_id, fmi.display_order, fmi.config_json
      FROM Form_Version_Set_Items fvsi
      JOIN Form_Master_Templates fmt ON fvsi.template_id = fmt.template_id
      JOIN Form_Master_Items fmi ON fvsi.template_id = fmi.template_id
      WHERE fvsi.version_set_id = @versionSetId
      ORDER BY fmt.template_name, fmi.display_order
    `);

  // 3. จัดระเบียบข้อมูล (เหมือนใน getSubmissionById)
  const blueprints = {};
  blueprintResult.recordset.forEach((item) => {
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
      config_json: JSON.parse(item.config_json), // Parse JSON ตรงนี้เลย
    });
  });

  console.log(`[PDF-Helper] Data prepared successfully.`);
  // 4. ส่งข้อมูลทั้งหมดกลับไป
  return {
    submission: {
      ...submissionData,
      form_data_json: JSON.parse(submissionData.form_data_json), // Parse JSON
    },
    blueprints: blueprints,
  };
}

async function createApprovalFlow(pool, submissionId, submittedBy) {
  let transaction;
  try {
    console.log(
      `[Approval] Creating flow for SubID: ${submissionId}, By: ${submittedBy}`
    );

    // 1. ดึง LV ของผู้บันทึก
    const userRequest = new sql.Request(pool);
    const userResult = await userRequest
      .input("submittedBy", sql.NVarChar, submittedBy)
      .query(
        "SELECT LV_Approvals FROM AGT_SMART_SY.dbo.Gen_Manu_Member WHERE Gen_Manu_mem_Memid = @submittedBy"
      );

    if (userResult.recordset.length === 0) {
      console.error(`[Approval] User not found: ${submittedBy}`);
      return;
    }

    const userLevel = userResult.recordset[0].LV_Approvals;
    console.log(`[Approval] User Level is: ${userLevel}`);

    // 2. กำหนด Flow ตามกฎ
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

    // 3. ถ้ามี Step ที่ต้องสร้าง ให้ INSERT ลง DB
    if (flowSteps.length > 0) {
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      const flowRequest = new sql.Request(transaction);

      const values = flowSteps
        .map(
          (step) =>
            `(${submissionId}, ${step.sequence}, ${step.required_level})`
        )
        .join(", ");

      const query = `
        INSERT INTO Gen_Approval_Flow (submission_id, sequence, required_level)
        VALUES ${values}
      `;

      await flowRequest.query(query);
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
    // 🚀 [แก้ไขจุดที่ 1] - แก้ไข Catch Block ของ createApprovalFlow
    // เราแค่ Log Error ไว้ แต่ไม่โยน Error
    console.error("Error creating approval flow:", error.message);
    // ตรวจสอบ "state" ก่อน rollback
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
  }
}

exports.createSubmission = async (req, res) => {
  const { formType, lotNo, templateIds, formData, submittedBy } = req.body;

  // ตรวจสอบข้อมูลเบื้องต้น
  if (!formType || !templateIds || templateIds.length === 0 || !formData) {
    return res.status(400).send({ message: "Missing required fields." });
  }

  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // --- 👇 ขั้นตอนที่ 1: "สืบค้นหา" Category ที่แท้จริงก่อน! 👇 ---
    const categoryRequest = new sql.Request(transaction);
    const categoryResult = await categoryRequest
      .input("firstTemplateId", sql.Int, templateIds[0]) // ใช้ templateId ตัวแรกเป็นตัวแทนในการค้นหา
      .query(
        "SELECT template_category FROM Form_Master_Templates WHERE template_id = @firstTemplateId"
      );

    if (categoryResult.recordset.length === 0) {
      throw new Error(
        `Cannot find category for template ID: ${templateIds[0]}`
      );
    }
    const correctCategory = categoryResult.recordset[0].template_category; // 👈 นี่คือ Category ที่ถูกต้อง ('GEN_A' หรือ 'GEN_B')

    // --- ขั้นตอนที่ 2: ตรวจสอบการเปลี่ยนเเปลงของ เพื่อบันทึก form vs ล่าสุด" ---
    let versionSetId;

    // Query เดิมทั้งหมด แต่จะเปลี่ยนตัวแปรที่ใช้เปรียบเทียบ
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

    const findSetRequest = new sql.Request(transaction);
    const existingSet = await findSetRequest
      .input("categoryToUse", sql.NVarChar, correctCategory) // 👈 ใช้ตัวแปรใหม่ที่ถูกต้อง
      .input("templateCount", sql.Int, templateIds.length)
      .query(findSetQuery);

    if (existingSet.recordset.length > 0) {
      // *เงือนไข ไม่มีการเปลี่ยนเเปลง
      versionSetId = existingSet.recordset[0].version_set_id;
    } else {
      // *เงือนไข แสดงว่ามีการเปลี่ยนแปลงโครงสร้างฟอร์ม
      // ปิด is_latest ของเวอร์ชันเก่า เพื่อบอกว่ามันไม่ใช่เวอร์ชันล่าสุดแล้ว
      const updateOldSetRequest = new sql.Request(transaction);
      await updateOldSetRequest
        .input("categoryToUse", sql.NVarChar, correctCategory)
        .query(
          "UPDATE Form_Version_Sets SET is_latest = 0 WHERE category = @categoryToUse AND is_latest = 1"
        );

      // สร้าง version set ใหม่
      const getNewVersionRequest = new sql.Request(transaction);
      const lastVersionResult = await getNewVersionRequest
        .input("categoryToUse", sql.NVarChar, correctCategory)
        .query(
          "SELECT ISNULL(MAX(version), 0) as lastVersion FROM Form_Version_Sets WHERE category = @categoryToUse"
        );
      const newVersion = lastVersionResult.recordset[0].lastVersion + 1;

      //บันทึกลงในตาราง Form_Version_Set_Items เพื่อผูกไว้กับ "สารบัญ" ใหม่ที่เราเพิ่งสร้าง
      const createSetRequest = new sql.Request(transaction);
      const newSetResult = await createSetRequest
        .input("categoryToUse", sql.NVarChar, correctCategory)
        .input("newVersion", sql.Int, newVersion)
        .query(
          "INSERT INTO Form_Version_Sets (category, version, is_latest) OUTPUT INSERTED.version_set_id VALUES (@categoryToUse, @newVersion, 1)"
        );
      versionSetId = newSetResult.recordset[0].version_set_id;

      // เพิ่ม items เข้าไป
      for (const templateId of templateIds) {
        const createSetItemRequest = new sql.Request(transaction);
        await createSetItemRequest
          .input("versionSetId", sql.Int, versionSetId)
          .input("templateId", sql.Int, templateId)
          .query(
            "INSERT INTO Form_Version_Set_Items (version_set_id, template_id) VALUES (@versionSetId, @templateId)"
          );
      }
    }

    // --- ขั้นตอนที่ 3: บันทึก Submission
    const submissionRequest = new sql.Request(transaction);
    const submissionResult = await submissionRequest
      .input("versionSetId", sql.Int, versionSetId)
      .input("formType", sql.NVarChar, formType)
      .input("lotNo", sql.NVarChar, lotNo)
      .input("submittedBy", sql.NVarChar, submittedBy).query(`
        INSERT INTO Form_Submissions (version_set_id, form_type, lot_no, submitted_by) 
        OUTPUT INSERTED.submission_id 
        VALUES (@versionSetId, @formType, @lotNo, @submittedBy)
      `);
    const submissionId = submissionResult.recordset[0].submission_id;

    // --- ขั้นตอนที่ 4: บันทึก Form Data (JSON) ---
    const dataRequest = new sql.Request(transaction);
    await dataRequest
      .input("submissionId", sql.Int, submissionId)
      .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData))
      .query(`
        INSERT INTO Form_Submission_Data (submission_id, form_data_json) 
        VALUES (@submissionId, @formDataJson)
      `);

    await transaction.commit();
    await createApprovalFlow(pool, submissionId, submittedBy); // 👈 ถูกต้อง

    res.status(201).send({
      message: "Form submitted successfully!",
      submissionId: submissionId,
    });
  } catch (error) {
    console.error("Error creating submission:", error.message);

    // 🚀 [แก้ไขจุดที่ 2] - แก้ไข Catch Block ของ createSubmission (บรรทัด ~291)
    // ตรวจสอบ "state" ก่อน rollback
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }

    res
      .status(500)
      .send({ message: "เกิดข้อผิดพลาดที่ Server", error: error.message });
  } finally {
    if (pool) {
      pool.close();
    }
  }
};

// 🎯 ฟังก์ชันใหม่ 1: สำหรับดึงรายการ Submission ทั้งหมด 🎯
exports.getAllSubmissions = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { category } = req.query; // 👈 ดึง "คำสั่ง" category มาจาก URL

    // --- 👇 สร้าง Query เริ่มต้น 👇 ---
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

    // --- 👇 ตรวจสอบว่ามี "คำสั่ง" ให้กรอง category หรือไม่ 👇 ---
    if (category) {
      baseQuery += ` WHERE fvs.category = @category`; // เพิ่มเงื่อนไข WHERE
      request.input("category", sql.NVarChar, category); // ส่งค่า category เข้าไปใน Query อย่างปลอดภัย
    }

    baseQuery += ` ORDER BY fs.submitted_at DESC`; // เพิ่มการเรียงลำดับในตอนท้าย

    const result = await request.query(baseQuery);

    res.status(200).send(result.recordset);
  } catch (err) {
    console.error("!!! ERROR in getAllSubmissions:", err);
    res
      .status(500)
      .send({ message: "Failed to retrieve submissions.", error: err.message });
  }
};

// 🎯 ฟังก์ชันใหม่ 2: สำหรับดึงข้อมูล Submission เดียวแบบละเอียด 🎯
exports.getSubmissionById = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const request = new sql.Request(pool);

    // 1. ดึงข้อมูลหลักจาก Submissions และ Submission_Data
    const submissionResult = await request.input("submissionId", sql.Int, id)
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
                u.agt_member_nameEN AS submitted_by_name
            FROM
                Form_Submissions fs
            JOIN
                Form_Submission_Data fsd ON fs.submission_id = fsd.submission_id

          LEFT JOIN
                agt_member u ON fs.submitted_by = u.agt_member_id COLLATE SQL_Latin1_General_CP1_CI_AS
            WHERE
                fs.submission_id = @submissionId
                  `);

    if (submissionResult.recordset.length === 0) {
      return res.status(404).send({ message: "Submission not found." });
    }

    const submissionData = submissionResult.recordset[0];
    const versionSetId = submissionData.version_set_id;

    // 2. ใช้ version_set_id เพื่อย้อนไปหา "พิมพ์เขียว" ที่ถูกต้อง
    const blueprintResult = await request.input(
      "versionSetId",
      sql.Int,
      versionSetId
    ).query(`
                SELECT 
                    fmt.template_id,
                    fmt.template_name,
                    fmt.template_category,
                    fmt.version,
                    fmi.item_id,
                    fmi.display_order,
                    fmi.config_json
                FROM 
                    Form_Version_Set_Items fvsi
                JOIN 
                    Form_Master_Templates fmt ON fvsi.template_id = fmt.template_id
                JOIN 
                    Form_Master_Items fmi ON fvsi.template_id = fmi.template_id
                WHERE 
                    fvsi.version_set_id = @versionSetId
                ORDER BY
                    fmt.template_name, fmi.display_order
            `);

    // 3. จัดระเบียบข้อมูลพิมพ์เขียวให้ Frontend ใช้งานง่าย
    const blueprints = {};
    blueprintResult.recordset.forEach((item) => {
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

    // 4. ส่งข้อมูลทั้งหมดกลับไป
    res.status(200).send({
      submission: {
        ...submissionData,
        form_data_json: JSON.parse(submissionData.form_data_json),
      },
      blueprints: blueprints,
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to retrieve submission details.",
      error: err.message,
    });
  }
};

exports.deleteSubmission = async (req, res) => {
  const { id } = req.params;

  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    request.input("submissionId", sql.Int, id);

    // 🚀 [แก้ไข] เพิ่มคำสั่งลบ 2 ตารางใหม่ (ลูก)

    // คำสั่งที่ 1: (ใหม่) ลบจากตาราง State (Gen_Approval_Flow)
    await request.query(
      "DELETE FROM Gen_Approval_Flow WHERE submission_id = @submissionId"
    );

    // คำสั่งที่ 2: (ใหม่) ลบจากตาราง Log (Gen_Approved_log)
    await request.query(
      "DELETE FROM Gen_Approved_log WHERE submission_id = @submissionId"
    );

    // คำสั่งที่ 3: (เดิม) ลบข้อมูลจากตารางลูก (Form_Submission_Data)
    await request.query(
      "DELETE FROM Form_Submission_Data WHERE submission_id = @submissionId"
    );

    // คำสั่งที่ 4: (เดิม) ลบข้อมูลจากตารางแม่ (Form_Submissions)
    const result = await request.query(
      "DELETE FROM Form_Submissions WHERE submission_id = @submissionId"
    );

    // (Logic การตรวจสอบ 404 และการ commit/rollback ที่เหลือของคุณถูกต้อง 100% ครับ)
    if (result.rowsAffected[0] === 0) {
      // (หมายเหตุ: rowsAffected[0] จากคำสั่งสุดท้าย อาจจะเป็น 0
      // ในขณะที่ 3 คำสั่งแรกอาจจะลบข้อมูลไปแล้ว แต่ก็ยังถือว่าไม่เจอ ID อยู่ดี)
      await transaction.commit();
      return res
        .status(404)
        .send({ message: `Submission with ID ${id} not found.` });
    }

    await transaction.commit();
    res
      .status(200)
      .send({ message: `Submission ID ${id} has been deleted successfully.` });
  } catch (err) {
    // 🚀 [แก้ไข] เพิ่มการตรวจสอบ 'state' ก่อน rollback (เหมือนที่เราทำใน createSubmission)
    if (transaction && transaction.state === "begun") {
      await transaction.rollback();
    }
    res
      .status(500)
      .send({ message: "Failed to delete submission.", error: err.message });
  } finally {
    // 🚀 [เพิ่ม] ต้องปิด pool เมื่อทำงานเสร็จ (สำคัญมาก)
    if (pool) {
      pool.close();
    }
  }
};

exports.updateSubmission = async (req, res) => {
  const { id } = req.params;
  const { lot_no, form_data } = req.body; // รับข้อมูลใหม่จาก Frontend
  console.log("Data received for update:", req.body);
  if (!lot_no || !form_data) {
    return res.status(400).send({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // 1. อัปเดตตารางหลัก (Form_Submissions)
      await transaction
        .request()
        .input("submission_id", sql.Int, id)
        .input("lot_no", sql.NVarChar, lot_no).query(`
          UPDATE Form_Submissions
          SET lot_no = @lot_no,
              submitted_at = GETDATE()
          WHERE submission_id = @submission_id;
        `);

      // 2. อัปเดตตารางข้อมูล JSON (Form_Submission_Data)
      await transaction
        .request()
        .input("submission_id", sql.Int, id)
        .input("form_data_json", sql.NVarChar, JSON.stringify(form_data))
        .query(`
          UPDATE Form_Submission_Data
          SET form_data_json = @form_data_json
          WHERE submission_id = @submission_id;
        `);

      await transaction.commit();
      res.status(200).send({ message: "อัปเดตข้อมูลสำเร็จ" });
    } catch (err) {
      await transaction.rollback();
      throw err; // ส่ง error ไปให้ catch ด้านนอกจัดการ
    }
  } catch (error) {
    console.error("SQL error", error);
    res.status(500).send({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล", error });
  }
};

exports.generatePdf = async (req, res) => {
  const { id } = req.params;
  const frontendPrintUrl = `http://localhost:5173/reports/print/${id}`;

  // ---------------------------------
  // --- ‼️ [จุดแก้ไข] ‼️ ---
  // ---------------------------------
  let browser;
  let page; // 👈 ⭐️ 1. ประกาศ 'page' ไว้ตรงนี้
  // ---------------------------------

  try {
    // 1. ดึงข้อมูลก่อน
    console.log(
      `[PDF Gen] 1. Fetching data for ID: ${id} BEFORE launching browser.`
    );
    const dataToInject = await getSubmissionDataForPdf(id); //
    console.log(`[PDF Gen] 1. Data fetched successfully.`);

    const reportName = dataToInject.submission.form_type || "Production Report"; // (ใส่ || '...' เผื่อไว้)
    const dynamicHeaderTemplate = `
      <div style="width: 100%; border-bottom: 1px solid #ccc; padding: 5px 20px;
                  font-size: 12px; color: #000; font-weight: bold;
                  display: flex; justify-content: center; align-items: center;">
        
        <span>ใบรายงานการผลิต: ${reportName} (Manufacturing ${reportName})</span>

      </div>
    `;

    // 2. เปิดเบราว์เซอร์
    console.log(`[PDF Gen] 2. Launching browser...`);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // ⭐️ 2. ลบ 'const' ออก เพราะเราประกาศ 'page' ไว้ข้างบนแล้ว
    page = await browser.newPage();

    // "หูทิพย์" (เหมือนเดิม)
    page.on("console", (msg) => {
      console.log(`[PUPPETEER-CONSOLE] ${msg.type()}: ${msg.text()}`);
    }); //
    page.on("pageerror", (err) => {
      console.error("[PUPPETEER-PAGE-ERROR] React Crash:", err);
    }); //

    // 3. ตั้งค่าการ "ดักจับ" Request (โค้ดของพี่ถูกต้องแล้ว)
    console.log(`[PDF Gen] 3. Setting up request interception...`);
    await page.setRequestInterception(true); //

    const expectedApiUrl = `/api/submissions/${id}`;

    page.on("request", (request) => {
      // ⭐️ ผมขอเปลี่ยนกลับเป็น .includes() นะครับ มันปลอดภัยกว่า ⭐️
      const url = request.url();
      if (!url.startsWith("data:")) {
        console.log(`[PUPPETEER-REQUEST] Trying to load: ${url}`);
      }

      if (url.includes(expectedApiUrl)) {
        // 👈 ⭐️ 3. เปลี่ยนกลับเป็น .includes()
        console.log(`[PDF Gen] 3.1. Intercepting API call: ${url}`);
        request.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(dataToInject),
        });
      } else {
        request.continue();
      }
    });

    // 4. ไปที่หน้าเว็บ (เหมือนเดิม)
    console.log(`[PDF Gen] 4. Navigating to: ${frontendPrintUrl}`);
    await page.goto(frontendPrintUrl, {
      waitUntil: "load",
      timeout: 60000,
    }); //

    // 5. รอ "สัญญาณ" (เหมือนเดิม)
    console.log("[PDF Gen] 5. Waiting for selector (#pdf-content-ready)...");
    await page.waitForSelector(
      "#pdf-content-ready, #pdf-status-error, #pdf-status-notfound",
      { timeout: 30000 } // ⭐️ ลดเวลารอเหลือ 30 วิ พอ
    ); //

    // 6. พิมพ์ PDF (เหมือนเดิม)
    console.log("[PDF Gen] 6. Page is ready. Generating PDF buffer...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: dynamicHeaderTemplate,
      footerTemplate: `
        <div style="width: 100%; padding: 5px 20px 0;
                    font-size: 10px; color: #555;
                    display: flex; justify-content: space-between; align-items: center;">
          
          <span style="flex: 1; text-align: left;">
            FM-AS2-001
          </span>
          
          <span style="flex: 1; text-align: center;">
            หน้า <span class="pageNumber"></span> / <span class="totalPages"></span>
          </span>

          <span style="flex: 1; text-align: right;"></span>
        </div>
      `,
      margin: {
        top: "50px", // 👈 แก้ไข (ตามคำขอ)
        right: "10px", // (อันนี้คงไว้ หรือแก้เป็น 0px ก็ได้)
        bottom: "20px",
        left: "10px", // (อันนี้คงไว้ หรือแก้เป็น 0px ก็ได้)
      },
      scale: 0.37, // 👈 เพิ่มเข้ามา (37%)
    });

    await browser.close();
    console.log("[PDF Gen] 7. Browser closed. Sending PDF.");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=report-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(`[PDF Gen] Error generating PDF for ID ${id}:`, error);

    // ⭐️ [ใหม่] ถ้ามัน Timeout ให้พิมพ์ HTML ออกมาดูเลย ⭐️
    // (คราวนี้ 'page' จะไม่ Error แล้ว!)
    if (error.name === "TimeoutError" && page) {
      const html = await page.content();
      console.error("[PUPPETEER-TIMEOUT-HTML] Page HTML on timeout:", html);
    }

    if (browser) {
      await browser.close();
    }

    if (error.message.includes("Submission not found")) {
      return res.status(404).send({
        message: `Failed to generate PDF: Submission ID ${id} not found.`,
      });
    }

    res
      .status(500)
      .send({ message: "Failed to generate PDF", error: error.message });
  }
};

exports.resubmitSubmission = async (req, res) => {
  const { id } = req.params; // submission_id ที่จะแก้ไข
  const { formDataJson } = req.body; // ข้อมูลฟอร์มใหม่

  let pool;
  let transaction;

  try {
    pool = await sql.connect(dbConfig);
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    // 1. "ประกาศ" Input ทั้งหมดแค่ครั้งเดียว (เหมือนเดิม)
    request.input("submissionId", sql.Int, id);
    request.input("formDataJson", sql.NVarChar, JSON.stringify(formDataJson));

    // --- (A) บันทึกข้อมูลใหม่ ---

    // 2. อัปเดต JSON Data (เหมือนเดิม)
    await request.query(`
          UPDATE Form_Submission_Data 
          SET form_data_json = @formDataJson 
          WHERE submission_id = @submissionId
      `);

    // 3. ‼️ [แก้ไข] อัปเดตตารางหลัก (เพิ่มการเปลี่ยน status) ‼️
    await request.query(`
          UPDATE Form_Submissions 
          SET 
              submitted_at = GETDATE(),
              status = 'Drafted' -- 👈 [ใหม่] เปลี่ยน status กลับเป็น Drafted
          WHERE 
              submission_id = @submissionId
              AND status = 'Rejected' -- 👈 (Update เฉพาะถ้ามันเป็น Rejected)
      `);

    // --- (B) ล้างค่าการอนุมัติเดิม ---

    // 4. "รีเซ็ต" Flow (เหมือนเดิม)
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

    // 5. "ล้าง" Log เก่า (เหมือนเดิม)
    await request.query(`
          DELETE FROM AGT_SMART_SY.dbo.Gen_Approved_log
          WHERE 
              submission_id = @submissionId
              AND action = 'Rejected' 
      `);

    // --- จบงาน ---
    await transaction.commit();
    res.status(200).json({ message: "Resubmitted successfully." });
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("Error resubmitting submission:", error);
    res
      .status(500)
      .json({ message: "Failed to resubmit", error: error.message });
  } finally {
    if (pool) {
      pool.close();
    }
  }
};
