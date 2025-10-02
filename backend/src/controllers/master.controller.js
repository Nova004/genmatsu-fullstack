// src/controllers/master.controller.js

const { pool, sql, poolConnect } = require("../db.js");

// --- เปลี่ยนชื่อฟังก์ชันเป็น getLatestTemplateByName ---
exports.getLatestTemplateByName = async (req, res) => {
  try {
    const { templateName } = req.params;

    if (!templateName) {
      return res.status(400).json({ message: "กรุณาระบุชื่อ Template" });
    }

    await poolConnect;

    // --- เพิ่ม AND is_latest = 1 เข้าไปใน query ---
    const templateResult = await pool
      .request()
      .input("templateName", sql.NVarChar, templateName)
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
    // --- 👇 1. เพิ่ม form_type เข้ามาใน SELECT 👇 ---
    const result = await pool.request().query(`
      SELECT 
        template_id, 
        template_name, 
        description,
        template_category,
        form_type 
      FROM 
        Form_Master_Templates 
      WHERE 
        is_latest = 1 
      ORDER BY 
        template_category, form_type, template_name;
    `);

    // --- 👇 2. เปลี่ยน Logic การจัดกลุ่มให้เป็น 2 ชั้น 👇 ---
    const groupedTemplates = result.recordset.reduce((acc, template) => {
      const { template_category, form_type } = template;

      if (!template_category || !form_type) {
        return acc; // ข้ามรายการที่ข้อมูลไม่สมบูรณ์
      }

      // สร้าง category key ถ้ายังไม่มี (เช่น acc['GEN_B'] = {})
      if (!acc[template_category]) {
        acc[template_category] = {};
      }
      // สร้าง form_type key ภายใต้ category นั้นๆ ถ้ายังไม่มี (เช่น acc['GEN_B']['BZ'] = [])
      if (!acc[template_category][form_type]) {
        acc[template_category][form_type] = [];
      }

      // เพิ่ม template เข้าไปในกลุ่มที่ถูกต้อง
      acc[template_category][form_type].push(template);

      return acc;
    }, {});

    res.status(200).json(groupedTemplates);
  } catch (error) {
    console.error("Error fetching all latest templates:", error);
    res
      .status(500)
      .json({ message: "Error fetching templates", error: error.message });
  }
};

// =============================================================
// === ฟังก์ชันใหม่สำหรับบันทึก Template เป็นเวอร์ชันใหม่ ===
// =============================================================
exports.updateTemplateAsNewVersion = async (req, res) => {
  const { templateName, items } = req.body;

  if (!templateName || !items || !Array.isArray(items)) {
    return res.status(400).json({ message: "Invalid data provided." });
  }

  const transaction = new sql.Transaction(pool);
  try {
    await poolConnect;
    await transaction.begin();

    const currentTemplateResult = await new sql.Request(transaction)
      .input("templateName", sql.NVarChar, templateName)
      .query(
        "SELECT * FROM Form_Master_Templates WHERE template_name = @templateName AND is_latest = 1"
      );

    if (currentTemplateResult.recordset.length === 0) {
      throw new Error(`Template with name ${templateName} not found.`);
    }
    const currentTemplate = currentTemplateResult.recordset[0];

    await new sql.Request(transaction)
      .input("templateId", sql.Int, currentTemplate.template_id)
      .query(
        "UPDATE Form_Master_Templates SET is_latest = 0 WHERE template_id = @templateId"
      );

    const newVersion = currentTemplate.version + 1;
    const newTemplateResult = await new sql.Request(transaction)
      .input("template_name", sql.NVarChar, currentTemplate.template_name)
      .input("template_type", sql.NVarChar, currentTemplate.template_type)
      .input(
        "description",
        sql.NVarChar,
        `${currentTemplate.description.split(" (v")[0]} (v${newVersion})`
      )
      .input("version", sql.Int, newVersion)
      .input("is_latest", sql.Bit, 1)
      .input(
        "template_category",
        sql.NVarChar,
        currentTemplate.template_category
      ).query(`
        INSERT INTO Form_Master_Templates (template_name, template_type, description, version, is_latest, template_category, created_at)
        OUTPUT inserted.template_id
        VALUES (@template_name, @template_type, @description, @version, @is_latest, @template_category, GETDATE());
      `);

    const newTemplateId = newTemplateResult.recordset[0].template_id;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const displayOrder = (i + 1) * 10;

      await new sql.Request(transaction)
        .input("template_id", sql.Int, newTemplateId)
        .input("display_order", sql.Int, displayOrder)
        .input("config_json", sql.NVarChar, JSON.stringify(item.config_json))
        .input("is_active", sql.Bit, item.is_active).query(`
          INSERT INTO Form_Master_Items (template_id, display_order, config_json, is_active)
          VALUES (@template_id, @display_order, @config_json, @is_active);
        `);
    }

    await transaction.commit();
    res.status(201).json({
      message: "Template updated successfully as new version.",
      newTemplateId: newTemplateId,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating template:", error);
    res
      .status(500)
      .json({ message: "Failed to update template.", error: error.message });
  }
};
// (ในอนาคตเราจะสร้างฟังก์ชัน getTemplateById สำหรับดูฟอร์มเก่าที่นี่)
