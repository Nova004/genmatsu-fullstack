// backend/src/controllers/report.controller.js
const { sql, poolConnect } = require("../db");

exports.getDailyProductionReport = async (req, res) => {
  try {
    const { date, lotNoPrefix } = req.query;
    const pool = await poolConnect;

    // แก้ไข Query: ใช้ชื่อคอลัมน์ให้ตรงกับ Database จริง 100%
    let query = `
      SELECT 
        s.submission_id,        -- แก้จาก s.id เป็น s.submission_id
        s.form_type,
        s.lot_no,
        s.production_line,
        s.submitted_at,         -- เพิ่มมาเผื่อใช้ debug
        d.input_kg,
        d.output_kg,
        d.yield_percent,
        d.st_target_value,
        d.pallet_data,
        d.production_date,
        d.moisture
      FROM Form_Submissions AS s
      JOIN Form_Submission_Data AS d ON s.submission_id = d.submission_id -- แก้เงื่อนไข JOIN
      WHERE s.status != 'Rejected'
    `;

    // กรองตามวันที่ผลิต
    if (date) {
      query += ` AND CAST(d.production_date AS DATE) = @date`;
    }
    // กรองตามเลข Lot (4 ตัวหน้า)
    if (lotNoPrefix) {
      query += ` AND s.lot_no LIKE @lotNoPrefix + '%'`;
    }

    // เรียงลำดับตามวันที่กดส่ง (submitted_at) หรือ id ก็ได้
    query += ` ORDER BY s.submission_id ASC`;

    const request = pool.request();
    if (date) request.input("date", sql.Date, date);
    if (lotNoPrefix) request.input("lotNoPrefix", sql.NVarChar, lotNoPrefix);

    const result = await request.query(query);
    const rawData = result.recordset;

    const reportData = {
      lineA: [],
      lineB: [],
      lineC: [],
    };

    rawData.forEach((item) => {
      const formattedItem = {
        id: item.submission_id, // ใช้ submission_id เป็น id หลัก
        productName: item.form_type,
        lotNo: item.lot_no,
        input: item.input_kg,
        output: item.output_kg,
        pallets: item.pallet_data ? JSON.parse(item.pallet_data) : [],
        stPlan: item.st_target_value,
        yield: item.yield_percent,
        moisture: item.moisture,
      };

      // จัดกลุ่มตาม production_line
      if (item.production_line === "A") {
        reportData.lineA.push(formattedItem);
      } else if (item.production_line === "B") {
        reportData.lineB.push(formattedItem);
      } else if (item.production_line === "C") {
        reportData.lineC.push(formattedItem);
      }
    });

    res.json(reportData);
  } catch (err) {
    console.error("Error fetching report:", err);
    res
      .status(500)
      .json({ message: "Error fetching report data", error: err.message });
  }
};
