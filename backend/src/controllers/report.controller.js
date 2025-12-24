// backend/src/controllers/report.controller.js
const { sql, poolConnect } = require("../db");
const pdfService = require("../services/pdf.service"); // <--- Import Service
const config = require("../config/env"); // หรือ path ที่เก็บ URL frontend ของคุณ

// --- Helper Function: ดึงข้อมูล (Refactor ออกมาใช้ร่วมกัน) ---
const fetchDailyReportDataInternal = async (date, lotNoPrefix) => {
  const pool = await poolConnect;

  // 1. สร้าง Query หลัก (จบที่ WHERE)
  let query = `
      SELECT 
        s.submission_id,
        s.form_type,
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
      WHERE s.status != 'Rejected'
  `;

  // 2. ต่อ String เงื่อนไข (AND ...)
  if (date) query += ` AND CAST(d.production_date AS DATE) = @date`;
  if (lotNoPrefix) query += ` AND s.lot_no LIKE @lotNoPrefix + '%'`;

  // 3. ใส่ ORDER BY เป็นบรรทัดสุดท้าย (เปลี่ยนตรงนี้เป็น s.lot_no)
  query += ` ORDER BY s.lot_no ASC`;

  const request = pool.request();
  if (date) request.input("date", sql.Date, date);
  if (lotNoPrefix) request.input("lotNoPrefix", sql.NVarChar, lotNoPrefix);

  const result = await request.query(query);
  const rawData = result.recordset;

  // Format Data
  const reportData = { lineA: [], lineB: [], lineC: [] };
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
    };
    if (item.production_line === "A") reportData.lineA.push(formattedItem);
    else if (item.production_line === "B") reportData.lineB.push(formattedItem);
    else if (item.production_line === "C") reportData.lineC.push(formattedItem);
  });

  return reportData;
};
// --- Controller 1: API สำหรับหน้าเว็บ (ใช้ Helper ข้างบน) ---
exports.getDailyProductionReport = async (req, res) => {
  try {
    const { date, lotNoPrefix } = req.query;
    const data = await fetchDailyReportDataInternal(date, lotNoPrefix);
    res.json(data);
  } catch (err) {
    console.error("Error fetching report:", err);
    res
      .status(500)
      .json({ message: "Error fetching data", error: err.message });
  }
};

// --- Controller 2: API สำหรับโหลด PDF (New!) ---
exports.downloadDailyReportPdf = async (req, res) => {
  try {
    const { date, lotNoPrefix } = req.query;
    if (!date) return res.status(400).send("Date is required");

    // 1. ดึงข้อมูลเตรียมไว้ก่อน
    const reportData = await fetchDailyReportDataInternal(date, null);

    // 2. กำหนด URL ของ Frontend หน้า Print
    // (ปรับ Port หรือ Domain ตาม Environment ของคุณ)
    // ควรใส่ไว้ใน .env แต่ถ้า hardcode เทสก่อนก็ใส่ตรงนี้
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const printUrl = `${FRONTEND_URL}/genmatsu/reports/daily/print?date=${date}`;

    // 3. เรียก Service สร้าง PDF
    const pdfBuffer = await pdfService.generateDailyReportPdf(
      date,
      lotNoPrefix
    );
    // 4. ส่งไฟล์กลับไป
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Daily_Report_${date}.pdf`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).send("Error generating PDF");
  }
};
// ✅ เพิ่มส่วนนี้ต่อท้ายไฟล์
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const pool = await poolConnect;
    const result = await pool
      .request()
      .input("date", sql.Date, date)
      .query(
        `SELECT TOP 1 summary_json FROM GEN_Daily_Report_Summary WHERE report_date = @date`
      );

    if (result.recordset.length > 0) {
      let data = result.recordset[0].summary_json;
      if (typeof data === "string")
        try {
          data = JSON.parse(data);
        } catch (e) {}
      res.json(data);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).send({ message: "Error fetching summary" });
  }
};

exports.saveDailySummary = async (req, res) => {
  try {
    const { date, summaryData } = req.body;
    if (!date) {
      return res.status(400).send({ message: "Date is required!" });
    }
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
