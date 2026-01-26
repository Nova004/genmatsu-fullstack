# คำอธิบายระบบ Activity Log (Audit Trail)

เอกสารนี้อธิบายการทำงานของระบบบันทึกประวัติการใช้งาน (Activity Log/Audit Trail) ที่ถูกพัฒนาขึ้นเพื่อติดตามการกระทำสำคัญต่างๆ ในระบบ (Create, Update, Delete, Approve, Reject) อย่างละเอียด

## 1. ภาพรวมการทำงาน (Architecture Overview)

ระบบ Log ถูกออกแบบมาให้ทำงานอยู่เบื้องหลัง (Background) เมื่อมี User ทำรายการใดๆ สำเร็จ ระบบจะทำการบันทึกข้อมูลลงฐานข้อมูล `Gen_Activity_Logs` โดยอัตโนมัติ โดยมีส่วนประกอบสำคัญดังนี้:

1.  **Database Table (`Gen_Activity_Logs`):** ที่เก็บข้อมูลดิบ
2.  **Auth Middleware:** ตัวระบุว่า "ใคร" เป็นคนทำ (ดึงจาก JWT Token)
3.  **Services & Controllers:** จุดที่สั่งให้บันทึก Log เมื่อทำงานสำเร็จ
4.  **Diff Helper:** ตัวช่วยอัจฉริยะสำหรับเปรียบเทียบข้อมูลเก่า vs ใหม่ (เพื่อดูว่าแก้อะไรไปบ้าง)

---

## 2. โครงสร้างฐานข้อมูล (Database)

ข้อมูลจะถูกเก็บในตาราง `Gen_Activity_Logs` บน SQL Server:

| Column Name     | Type          | Description                                                             |
| :-------------- | :------------ | :---------------------------------------------------------------------- |
| `log_id`        | INT (PK)      | รหัส Log (Running Number)                                               |
| `user_id`       | NVARCHAR(50)  | รหัสพนักงานของผู้ทำรายการ (เช่น 65001)                                  |
| `action_type`   | NVARCHAR(50)  | ประเภทการกระทำ (CREATE, UPDATE, DELETE, APPROVED, REJECTED)             |
| `target_module` | NVARCHAR(50)  | โมดูลที่ถูกกระทำ (เช่น GEN-A, GEN-B, Ironpowder (Recycle))              |
| `target_id`     | NVARCHAR(50)  | ID ของเอกสารที่ถูกกระทำ                                                 |
| `details`       | NVARCHAR(MAX) | รายละเอียดเพิ่มเติม (เช่น Lot No, สาเหตุที่ Reject, หรือข้อมูลที่แก้ไข) |
| `timestamp`     | DATETIME      | เวลาที่เกิดเหตุการณ์ (เก็บอัตโนมัติเมื่อ Insert)                        |

---

## 3. ขั้นตอนการทำงาน (Step-by-Step Workflow)

### ตัวอย่างที่ 1: การแก้ไขข้อมูล (Update Submission)

1.  **Frontend:** User แก้ไขข้อมูลหน้าเว็บและกดบันทึก
    - ระบบแนบ **Token** (ที่ระบุตัวตน User) ไปกับ Header ของ Request `PUT /api/submissions/:id`
2.  **Backend Middleware (`auth.middleware.js`):**
    - แกะ Token ออกมาเพื่อดูว่า User คือใคร (เช่น `req.user.id = '66005'`)
3.  **Service Layer (`submission.service.js`):**
    - **Step A (Before Update):** ระบบจะแอบไปดึงข้อมูล **"ฉบับเก่า"** ใน Database ออกมาเก็บไว้ก่อน
    - **Step B (Update):** ทำการ Update ข้อมูลใหม่ลง Database ตามปกติ
    - **Step C (Compare & Log):**
      - เรียกใช้ **Diff Helper** เพื่อเปรียบเทียบ "ฉบับเก่า" vs "ฉบับใหม่"
      - สร้างข้อความสรุปความเปลี่ยนแปลง (เช่น `Changes: basicData.machine: 01 -> 02`)
      - บันทึกลงตาราง `Gen_Activity_Logs`
4.  **Result:** ได้ Log ที่บอกชัดเจนว่าใครแก้, แก้เอกสารไหน, และแก้อะไรไปบ้าง

### ตัวอย่างที่ 2: การอนุมัติ/ตีกลับ (Approve/Reject)

1.  **Controller Layer (`approval.controller.js`):**
    - เมื่อ User กด Approve หรือ Reject
2.  **Logic Check:**
    - ระบบตรวจสอบสิทธิ์ว่า User มี Level ถึงกำหนดหรือไม่
3.  **Log Creation:**
    - ระบบจะวิ่งไปค้นหา **Lot No** ของเอกสารนั้นๆ (เพื่อให้ Log อ่านรู้เรื่องกว่าการเก็บแค่ ID)
    - บันทึก Log พร้อม **เหตุผล (Reason/Comment)** ที่ User กรอกมา
    - _ตัวอย่าง Log:_ `REJECTED Lot No: GEN-002. Reason: ข้อมูลน้ำหนักไม่ถูกต้อง`

---

## 4. เจาะลึกฟีเจอร์ "Diff Helper" (การเปรียบเทียบข้อมูล)

นี่คือ "สมอง" ของระบบ Log ที่ช่วยให้เรารู้ว่า User แก้อะไรไปบ้าง (อยู่ในไฟล์ `backend/src/utils/diffHelper.js`)

**หลักการทำงาน:**

- รับค่า JSON เก่า และ JSON ใหม่
- วน Loop ตรวจสอบทุก Field (รวมถึง Field ที่ซ้อนกันหลายชั้น)
- **ถ้าเจอค่าต่างกัน:** บันทึกว่า `Field: ค่าเก่า -> ค่าใหม่`
- **ถ้าเจอ Array เปลี่ยน:** แจ้งเตือนว่า `[Array updated]`
- **การแสดงผล:** รวมความเปลี่ยนแปลงทั้งหมดเป็นประโยคเดียวแล้วต่อท้ายในช่อง `details` ของ Log

---

## 5. สรุปความสามารถ

- ✅ **ระบุตัวตนได้:** รู้เสมอว่าใครทำ (User ID ไม่ใช่ System)
- ✅ **แยกประเภทได้:** แยกออกว่าเป็นงาน GEN-A, GEN-B หรือ Recycle
- ✅ **ละเอียด:** บอก Lot No และบอกว่าแก้ไขข้อมูลจุดไหน (Changes log)
- ✅ **ครอบคลุม:** รองรับ Create, Update, Delete, Approve, Reject, Resubmit

---

_เอกสารนี้จัดทำโดย Antigravity AI Assistant_
