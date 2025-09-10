// src/controllers/master.controller.js

const { pool, sql, poolConnect } = require('../db.js');

// ฟังก์ชันสำหรับดึงข้อมูล "พิมพ์เขียว" (Template) จากชื่อของมัน
exports.getTemplateByName = async (req, res) => {
  try {
    const { template_name } = req.params; // ดึงชื่อ template ที่ส่งมากับ URL

    if (!template_name) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อ Template' });
    }

    // รอให้การเชื่อมต่อฐานข้อมูลเสร็จสมบูรณ์
    await poolConnect;

    // 1. ค้นหา template_id จากชื่อของ template
    const templateResult = await pool.request()
      .input('templateName', sql.NVarChar, template_name)
      .query('SELECT template_id FROM Form_Master_Templates WHERE template_name = @templateName');
    
    if (templateResult.recordset.length === 0) {
      return res.status(404).json({ message: 'ไม่พบ Template ที่ระบุ' });
    }

    const templateId = templateResult.recordset[0].template_id;

    // 2. ดึงไอเท็มทั้งหมดที่อยู่ใน template นั้น โดยเรียงตาม display_order
    const itemsResult = await pool.request()
      .input('templateId', sql.Int, templateId)
      .query('SELECT item_id, display_order, config_json, is_active FROM Form_Master_Items WHERE template_id = @templateId AND is_active = 1 ORDER BY display_order ASC');
    
    // 3. แปลงค่า config_json จาก String ให้กลายเป็น Object จริงๆ
    const formattedItems = itemsResult.recordset.map(item => {
        try {
            // เราจะ parse JSON ที่นี่เลย เพื่อให้ Frontend ใช้งานได้ง่าย
            item.config_json = JSON.parse(item.config_json);
            return item;
        } catch (e) {
            console.error(`Error parsing JSON for item_id: ${item.item_id}`, e);
            // ถ้า JSON ผิดพลาด อาจจะ return null หรือ object فاضي
            return { ...item, config_json: { error: 'Invalid JSON format' } };
        }
    });

    // 4. ส่งข้อมูลกลับไปให้ Frontend
    res.status(200).json(formattedItems);

  } catch (error) {
    console.error("Error in getTemplateByName:", error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
};