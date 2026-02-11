// backend/src/controllers/report.controller.js
const { sql, poolConnect } = require("../db");
const pdfService = require("../services/pdf.service");
const config = require("../config/env");
const excelService = require("../services/excel.service");

// --- Helper: Fetch Data for Whole Month ---
const fetchMonthlyReportDataInternal = async (year, month) => {
  const pool = await poolConnect;

  // Start Date: 1st of Month
  const startDate = new Date(year, month - 1, 1);
  startDate.setHours(0, 0, 0, 0);

  // End Date: 1st of Next Month (Exclusive)
  const endDate = new Date(year, month, 1);
  endDate.setHours(0, 0, 0, 0);

  let query = `
    SELECT * FROM (
      SELECT 
        s.submission_id, 
        COALESCE(p.Gen_Name, s.form_type) AS form_type, -- ✅ Use Name from Master, fallback to ID/String
        s.lot_no, s.production_line, s.submitted_at,
        d.input_kg, d.output_kg, d.yield_percent, d.st_target_value, d.pallet_data, d.production_date, d.form_data_json,
        d.AZ_RGenmatsu, -- ✅ Fetch Mix Recycle Data
        (d.st_target_value - COALESCE(mt.target_value, 0)) AS mix_ncr
      FROM Form_Submissions AS s
      JOIN Form_Submission_Data AS d ON s.submission_id = d.submission_id
      LEFT JOIN Gen_StandardPlan_MT AS mt ON s.form_type = mt.form_type COLLATE Thai_CI_AS -- ✅ Join Standard Plan (Updated to ID)
      LEFT JOIN gen_product AS p ON s.form_type = p.Gen_Id COLLATE Thai_CI_AS -- ✅ Join Master Product
      WHERE s.status != 'Rejected'
        AND d.production_date >= @startDate AND d.production_date < @endDate

      UNION ALL

      SELECT 
        ip.submissionId AS submission_id,
        ip.machine_name AS form_type,
        ip.lot_no,
        'Line R' AS production_line,
        ip.created_at AS submitted_at,
        ip.total_input AS input_kg,
        ip.total_genmatsu_a AS output_kg,
        0 AS yield_percent, -- Calculate later or use aggregated
        COALESCE(mt.target_value, 0) AS st_target_value, -- ✅ Fetch Plan from Master Table
        NULL AS pallet_data, 
        ip.report_date AS production_date,
        ip.form_data_json,
        0 AS AZ_RGenmatsu, -- No Mix Recycle column for Ironpowder yet
        0 AS mix_ncr -- No Mix NCR for Ironpowder?
      FROM Form_Ironpowder_Submissions AS ip
      LEFT JOIN gen_product p_ip ON ip.machine_name = p_ip.Gen_Name COLLATE Thai_CI_AS -- Map Name -> ID
      LEFT JOIN Gen_StandardPlan_MT AS mt ON p_ip.Gen_Id = mt.form_type COLLATE Thai_CI_AS -- Join Standard Plan (ID)
      WHERE ip.status != 'Rejected'
        AND ip.report_date >= @startDate AND ip.report_date < @endDate
  ) AS UnifiedReport
  ORDER BY production_date ASC, production_line ASC
  `;

  const result = await pool.request()
    .input("startDate", sql.DateTime, startDate)
    .input("endDate", sql.DateTime, endDate)
    .query(query);

  return result.recordset;
};

// --- Controller 5: Export Monthly Excel ---
exports.downloadMonthlyExcel = async (req, res) => {
  try {
    const { month } = req.query; // Format: "YYYY-MM"
    if (!month) return res.status(400).send({ message: "Month is required (YYYY-MM)" });

    const [year, monthNum] = month.split("-").map(Number);
    const rawData = await fetchMonthlyReportDataInternal(year, monthNum);

    // Map Raw Data to Formatted Items
    const reportData = rawData.map(item => ({
      productName: item.form_type,
      lotNo: item.lot_no,
      production_line: item.production_line, // Pass raw line for service to parse
      input: item.input_kg,
      output: item.output_kg,
      yield: item.yield_percent,
      production_date: item.production_date,
      target: item.st_target_value,
      palletData: item.pallet_data,
      formData: item.form_data_json,
      mixNCR: item.mix_ncr, // ✅ Passed from SQL
      AZ_RGenmatsu: item.AZ_RGenmatsu // ✅ Passed to Service
    }));

    // Generate Excel (Pass Array directly)
    const buffer = await excelService.generateMonthlyReport(month, reportData);

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=Monthly_Report_${month}.xlsx`,
      "Content-Length": buffer.length,
    });
    res.send(buffer);

  } catch (error) {
    console.error("Error exporting Excel:", error);
    res.status(500).send({ message: "Error generating Excel report" });
  }
};

const fetchDailyReportDataInternal = async (date, lotNoPrefix) => {
  const pool = await poolConnect;

  // 1. สร้าง Query หลัก
  let query = `
      SELECT 
        s.submission_id,
        COALESCE(p.Gen_Name, s.form_type) AS form_type, -- ✅ Use Name from Master
        s.lot_no,
        s.production_line,
        s.submitted_at,
        d.input_kg,
        d.output_kg,
        d.yield_percent,
        d.st_target_value,
        d.pallet_data,
        d.production_date,
        d.moisture
      FROM Form_Submissions AS s
      JOIN Form_Submission_Data AS d ON s.submission_id = d.submission_id
      LEFT JOIN gen_product AS p ON s.form_type = p.Gen_Id COLLATE Thai_CI_AS -- ✅ Join Master Product
      WHERE s.status != 'Rejected'
  `;

  // 2. เงื่อนไข (Optimized for Index Usage 🚀)
  // ใช้ Range Query แทนการ CAST เพื่อให้ SQL Server ใช้ Index ได้ (SARGable)
  if (date) {
    query += ` AND d.production_date >= @startDate AND d.production_date < @endDate`;
  }

  if (lotNoPrefix) {
    query += ` AND s.lot_no LIKE @lotNoPrefix + '%'`;
  }

  // 3. Order By
  query += ` ORDER BY s.lot_no ASC`;

  const request = pool.request();

  if (date) {
    // Generate Range: 00:00:00 to 23:59:59 (Next Day 00:00:00)
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);

    request.input("startDate", sql.DateTime, start); // ใช้ DateTime เพื่อความแม่นยำ
    request.input("endDate", sql.DateTime, end);
  }

  if (lotNoPrefix) request.input("lotNoPrefix", sql.NVarChar, lotNoPrefix);

  const result = await request.query(query);

  // ✅ แก้ตรงนี้: ส่ง recordset (Array) กลับไปเลย ไม่ต้องจัดกลุ่มที่นี่
  return result.recordset;
};

// --- Controller 1: API สำหรับหน้าเว็บ ---
exports.getDailyProductionReport = async (req, res) => {
  try {
    const { date, lotNoPrefix } = req.query;
    const rawData = await fetchDailyReportDataInternal(date, lotNoPrefix);

    // ✅ เปลี่ยนชื่อ Key เป็น lineD
    const reportData = {
      lineA: [],
      lineB: [],
      lineC: [],
      lineD: [], // เปลี่ยนจาก lineZE1A เป็น lineD
    };

    if (rawData && rawData.length > 0) {
      rawData.forEach((item) => {
        const formattedItem = {
          id: item.submission_id,
          productName: item.form_type,
          lotNo: item.lot_no,
          input: item.input_kg,
          output: item.output_kg,
          pallets: item.pallet_data ? JSON.parse(item.pallet_data) : [],
          stPlan: item.st_target_value,
          yield: item.yield_percent,
          moisture: item.moisture,
          production_date: item.production_date,
        };

        const lineName = item.production_line || "";

        if (lineName.includes("Line A") || lineName === "A") {
          reportData.lineA.push(formattedItem);
        } else if (lineName.includes("Line B") || lineName === "B") {
          reportData.lineB.push(formattedItem);
        } else if (lineName.includes("Line C") || lineName === "C") {
          reportData.lineC.push(formattedItem);
        } else if (lineName.includes("Line D") || lineName === "D") {
          reportData.lineD.push(formattedItem);
        }
      });
    }

    res.status(200).json(reportData);
  } catch (err) {
    console.error("Error fetching report:", err);
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
};

const ironpowderService = require("../services/ironpowder.service");

// --- Controller 2: API Summary (แก้ไขเพื่อรวม Ironpowder) ---
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).send({ message: "Date is required" });

    const pool = await poolConnect;

    // 1. ดึง Remarks (เดิม)
    const remarksResult = await pool
      .request()
      .input("date", sql.Date, date)
      .query(
        `SELECT summary_json FROM GEN_Daily_Report_Summary WHERE report_date = @date`
      );

    let summaryData = {};
    if (remarksResult.recordset.length > 0) {
      let data = remarksResult.recordset[0].summary_json;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
          summaryData = data; // คาดหวัง { remarks: {...} }
        } catch (e) { }
      }
    }

    // 2. ดึง Ironpowder Summary (ใหม่)
    const recycleData = await ironpowderService.getIronpowderSummaryByDate(date);

    // 3. รวมร่าง
    const finalResponse = {
      ...summaryData, // remarks เดิม
      recycleData, // ข้อมูลใหม่
    };

    res.json(finalResponse);
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).send({ message: "Error fetching summary" });
  }
};

// --- Controller 3: API Save Summary (เหมือนเดิม) ---
exports.saveDailySummary = async (req, res) => {
  try {
    const { date, summaryData } = req.body;
    if (!date) return res.status(400).send({ message: "Date is required!" });

    const pool = await poolConnect;
    const jsonString = JSON.stringify(summaryData);

    const checkExist = await pool
      .request()
      .input("date", sql.Date, date)
      .query(
        `SELECT id FROM GEN_Daily_Report_Summary WHERE report_date = @date`
      );

    if (checkExist.recordset.length > 0) {
      await pool
        .request()
        .input("date", sql.Date, date)
        .input("jsonString", sql.NVarChar(sql.MAX), jsonString)
        .query(
          `UPDATE GEN_Daily_Report_Summary SET summary_json = @jsonString, updated_at = GETDATE() WHERE report_date = @date`
        );
    } else {
      await pool
        .request()
        .input("date", sql.Date, date)
        .input("jsonString", sql.NVarChar(sql.MAX), jsonString)
        .query(
          `INSERT INTO GEN_Daily_Report_Summary (report_date, summary_json, updated_at) VALUES (@date, @jsonString, GETDATE())`
        );
    }
    res.json({ message: "Saved successfully" });
  } catch (error) {
    console.error("Error saving summary:", error);
    res.status(500).send({ message: "Error saving summary" });
  }
};

// --- Controller 4: API Download PDF (เหมือนเดิม) ---
exports.downloadDailyReportPdf = async (req, res) => {
  try {
    const { date, lotNoPrefix } = req.query;
    if (!date) return res.status(400).send({ message: "Date is required" });

    // สร้าง PDF buffer
    const pdfBuffer = await pdfService.generateDailyReportPdf(
      date,
      lotNoPrefix
    );

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Daily_Report_${date}.pdf`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send({ message: "Error generating PDF" });
  }
};
