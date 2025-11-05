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
  const submissionResult = await request.input(
    "submissionId",
    sql.Int,
    submissionId
  ).query(`
      SELECT 
          fs.submission_id, fs.version_set_id, fs.form_type, fs.lot_no,
          fs.submitted_by, fs.submitted_at, fsd.form_data_json
      FROM Form_Submissions fs
      JOIN Form_Submission_Data fsd ON fs.submission_id = fsd.submission_id
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
    res.status(201).send({
      message: "Form submitted successfully!",
      submissionId: submissionId,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("!!! ERROR in createSubmission:", err); // 👈 มีตัวช่วย Debug แล้ว
    res
      .status(500)
      .send({ message: "Failed to submit form.", error: err.message });
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
                    fsd.form_data_json
                FROM 
                    Form_Submissions fs
                JOIN 
                    Form_Submission_Data fsd ON fs.submission_id = fsd.submission_id
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
  // ดึง 'id' ที่ต้องการลบจาก URL parameter
  const { id } = req.params;

  // สร้าง connection pool ใหม่ ตามสไตล์ของไฟล์นี้
  const pool = await sql.connect(dbConfig);
  // เริ่ม transaction จาก pool ที่เพิ่งสร้าง
  const transaction = new sql.Transaction(pool);

  try {
    // เริ่มต้น transaction
    await transaction.begin();

    // สร้าง request ที่จะทำงานภายใต้ transaction นี้
    const request = new sql.Request(transaction);

    // ผูกตัวแปร id เข้ากับ SQL query อย่างปลอดภัย
    request.input("submissionId", sql.Int, id);

    // คำสั่งที่ 1: ลบข้อมูลจากตารางลูก (Form_Submission_Data) ก่อนเสมอ
    await request.query(
      "DELETE FROM Form_Submission_Data WHERE submission_id = @submissionId"
    );

    // คำสั่งที่ 2: ลบข้อมูลจากตารางแม่ (Form_Submissions)
    const result = await request.query(
      "DELETE FROM Form_Submissions WHERE submission_id = @submissionId"
    );

    // ตรวจสอบว่ามีข้อมูลถูกลบจริงหรือไม่
    if (result.rowsAffected[0] === 0) {
      // ถ้าไม่มีแถวไหนถูกลบ แสดงว่า ID นั้นไม่มีอยู่
      // เรายังคง commit transaction เพราะไม่มีอะไรผิดพลาด แค่ไม่มีข้อมูลให้ลบ
      await transaction.commit();
      return res
        .status(404)
        .send({ message: `Submission with ID ${id} not found.` });
    }

    // ถ้าทุกอย่างสำเร็จ ให้ commit transaction (ยืนยันการลบ)
    await transaction.commit();

    // ส่งข้อความกลับไปบอก Frontend ว่าลบสำเร็จแล้ว (ใช้ .send ตามสไตล์ของคุณ)
    res
      .status(200)
      .send({ message: `Submission ID ${id} has been deleted successfully.` });
  } catch (err) {
    // หากเกิดข้อผิดพลาด ให้ยกเลิกการเปลี่ยนแปลงทั้งหมด
    await transaction.rollback();
    // และส่ง Error กลับไป
    res
      .status(500)
      .send({ message: "Failed to delete submission.", error: err.message });
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
