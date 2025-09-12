// src/controllers/master.controller.js

const { pool, sql, poolConnect } = require("../db.js");

// --- เปลี่ยนชื่อฟังก์ชันเป็น getLatestTemplateByName ---
exports.getLatestTemplateByName = async (req, res) => {
  try {
    const { templateName } = req.params;

    if (!templateName) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อ Template' });
    }

    await poolConnect;

    // --- เพิ่ม AND is_latest = 1 เข้าไปใน query ---
    const templateResult = await pool
      .request()
      .input('templateName', sql.NVarChar, templateName) 
      .query(
        "SELECT * FROM Form_Master_Templates WHERE template_name = @templateName AND is_latest = 1"
      );

    if (templateResult.recordset.length === 0) {
      return res.status(404).json({ message: "ไม่พบ Template เวอร์ชันล่าสุด" });
    }

    const templateData = templateResult.recordset[0];
    const templateId = templateData.template_id;

    const itemsResult = await pool
      .request()
      .input("templateId", sql.Int, templateId)
      .query(
        "SELECT * FROM Form_Master_Items WHERE template_id = @templateId AND is_active = 1 ORDER BY display_order ASC"
      );

    const formattedItems = itemsResult.recordset.map((item) => {
      try {
        item.config_json = JSON.parse(item.config_json);
        return item;
      } catch (e) {
        console.error(`Error parsing JSON for item_id: ${item.item_id}`, e);
        return { ...item, config_json: { error: "Invalid JSON format" } };
      }
    });

    // --- ส่งข้อมูลกลับไปให้ Frontend ในรูปแบบใหม่ ---
    res.status(200).json({
      template: templateData, // ส่งข้อมูลของ Template ไปด้วย (เผื่อต้องใช้ template_id)
      items: formattedItems, // ส่งรายการไอเท็ม
    });
  } catch (error) {
    console.error("Error in getLatestTemplateByName:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
  }
};

exports.getAllLatestTemplates = async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT template_id, template_name, description 
      FROM Form_Master_Templates 
      WHERE is_latest = 1 
      ORDER BY template_name;
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error fetching all latest templates:', error);
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

// (ในอนาคตเราจะสร้างฟังก์ชัน getTemplateById สำหรับดูฟอร์มเก่าที่นี่)
