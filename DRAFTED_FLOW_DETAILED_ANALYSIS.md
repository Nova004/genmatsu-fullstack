# 🔍 ตรวจสอบละเอียด: เมื่อกด "Draft" ปุ่มจะเกิดอะไร

---

## 📍 จุดเริ่มต้น: ปุ่ม "Draft"

### Location: `Ironpowder_index.tsx` Line 243

```tsx
<button
  type="button"
  onClick={onDraft}
  disabled={isSubmitting}
  className={`rounded-md bg-primary px-10 py-2 font-medium text-white...`}
>
  {isSubmitting ? "กำลังบันทึก..." : "Draft"}
</button>
```

**เมื่อผู้ใช้คลิกปุ่ม:**

```
onClick → onDraft (callback function)
```

---

## 🔄 ขั้นตอนที่ 1: Frontend Hook Execution

### `useProductionForm.ts` - Line 119-138

```typescript
const handleDraftSubmit = async () => {
  setIsSubmitting(true); // ✅ ปุ่มเปลี่ยนเป็น disabled + "กำลังบันทึก..."
  const data = formMethods.getValues(); // ✅ ดึงข้อมูลทั้งหมดจากฟอร์ม (ไม่ validate)

  try {
    // ✅ Check formType
    if (formType === "Ironpowder") {
      const ironpowderPayload = {
        lotNo: data.basicData.lotNo, // ✅ Lot No (จำเป็น)
        formData: data, // ✅ ข้อมูลฟอร์มทั้งหมด
        submittedBy: user?.id || "unknown_user", // ✅ User ID
      };

      // ✅ เรียก API
      const result =
        await ironpowderService.createIronpowder(ironpowderPayload);

      // ✅ สำเร็จ → แสดง Toast
      fireToast(
        "success",
        `บันทึกร่าง Ironpowder สำเร็จ! (ID: ${result.submissionId})`,
      );

      // ✅ Navigate
      navigate("/reports/history/recycle", {
        state: { highlightedId: result.submissionId },
      });
      return; // ✅ ออกจากฟังก์ชัน
    }
  } catch (error: any) {
    // ❌ Error handling
    fireToast("error", `บันทึกร่างไม่สำเร็จ: ${errorMessage}`);
  } finally {
    setIsSubmitting(false); // ✅ ปุ่มกลับมา enabled
  }
};
```

**สิ่งที่เกิดขึ้น:**

1. ✅ Disable ปุ่มทั้งสอง
2. ✅ ดึงข้อมูล formData ทั้งหมด (getValues ไม่ validate)
3. ✅ สร้าง payload object
4. ✅ เรียก API: `ironpowderService.createIronpowder(payload)`

---

## 🌐 ขั้นตอนที่ 2: Frontend Service Call

### `ironpowder.service.ts`

```typescript
createIronpowder: async (data) => {
  try {
    // ✅ ยิง POST request ไป /api/ironpowder
    const response = await api.post("/ironpowder", data);
    return response.data; // ✅ Return { submissionId: ... }
  } catch (error) {
    throw error.response?.data || error; // ❌ Error handling
  }
};
```

**HTTP Request ที่ส่ง:**

```
POST /api/ironpowder
Content-Type: application/json

{
    "lotNo": "IP-2024-001",
    "formData": {
        "basicData": { "lotNo": "IP-2024-001", "date": "2024-01-16", "machineName": "Machine A" },
        "inputProduct": [...],
        "outputGenmatsuA": [...],
        "outputGenmatsuB": [...],
        ...
    },
    "submittedBy": 1  // User ID
}
```

---

## 🔌 ขั้นตอนที่ 3: Backend Route Handler

### `ironpowder.routes.js`

```javascript
router.post(
  "/",
  validate(ironpowderValidator.createIronpowder), // ✅ Validate payload
  ironpowderController.createIronpowder,
);
```

**ตรวจสอบ:**

- ✅ Content-Type: application/json
- ✅ Validation schema checks:
  - `lotNo` (required: string)
  - `formData` (required: object)
  - `submittedBy` (required: number)

---

## 🎛️ ขั้นตอนที่ 4: Backend Controller

### `ironpowder.controller.js` - Line 5-34

```javascript
exports.createIronpowder = async (req, res) => {
  // ✅ ดึงข้อมูลจาก request body
  const { lotNo, formData, submittedBy } = req.body;

  if (!lotNo || !formData || !submittedBy) {
    // ❌ 400 Bad Request
    return res.status(400).send({ message: "Missing required fields." });
  }

  try {
    // ✅ ตรวจสอบ Lot No ซ้ำหรือไม่
    const isDuplicate = await ironpowderService.checkLotNoExists(lotNo);
    if (isDuplicate) {
      // ❌ 409 Conflict - Lot No มีอยู่แล้ว
      return res.status(409).send({
        message: `Lot No: ${lotNo} มีอยู่ในระบบแล้ว`,
        errorCode: "DUPLICATE_LOT",
      });
    }

    // ✅ เรียก Service เพื่อสร้าง Ironpowder
    const submissionId = await ironpowderService.createIronpowder({
      lotNo,
      formData,
      submittedBy,
    });

    // ✅ 201 Created - สำเร็จ
    res.status(201).send({
      message: "Ironpowder form submitted successfully!",
      submissionId: submissionId,
    });
  } catch (error) {
    // ❌ 500 Server Error
    res.status(500).send({
      message: "เกิดข้อผิดพลาดที่ Server",
      error: error.message,
    });
  }
};
```

**กรณี Error:**

- ❌ **400**: Missing required fields
- ❌ **409**: Lot No ซ้ำ
- ❌ **500**: Server error

**กรณี Success:**

- ✅ **201**: Return `submissionId`

---

## 🏗️ ขั้นตอนที่ 5: Backend Service (Core Logic)

### `ironpowder.service.js` - Line 84-141

#### 5.1 สร้าง Transaction

```javascript
const pool = await poolConnect; // ✅ เชื่อมต่อฐานข้อมูล
transaction = new sql.Transaction(pool);
await transaction.begin(); // ✅ เริ่ม transaction (rollback if error)
```

#### 5.2 Extract Key Metrics จาก formData

```javascript
// ✅ ดึงค่าสำคัญออกมา
const totalInput = formData.totalInput || 0; // เช่น 100
const totalOutput = formData.totalOutput || 0; // เช่น 90
const diffWeight = totalInput - totalOutput; // คำนวณ = 10
const reportDate = formData.basicData?.date || null; // เช่น "2024-01-16"
const machineName = formData.basicData?.machineName || null; // เช่น "Machine A"
```

#### 5.3 INSERT ลง Database

```javascript
await transaction
  .request()
  .input("lotNo", sql.NVarChar, lotNo) // ✅ "IP-2024-001"
  .input("formType", sql.NVarChar, "Ironpowder") // ✅ "Ironpowder"
  .input("submittedBy", sql.Int, submittedBy) // ✅ 1
  .input("status", sql.NVarChar, "Submitted") // ✅ "Submitted"
  .input("reportDate", sql.Date, reportDate) // ✅ "2024-01-16"
  .input("machineName", sql.NVarChar, machineName) // ✅ "Machine A"
  .input("totalInput", sql.Decimal(10, 2), totalInput) // ✅ 100.00
  .input("totalOutput", sql.Decimal(10, 2), totalOutput) // ✅ 90.00
  .input("diffWeight", sql.Decimal(10, 2), diffWeight) // ✅ 10.00
  .input("formDataJson", sql.NVarChar(sql.MAX), JSON.stringify(formData)) // ✅ JSON
  .query(`
        INSERT INTO Form_Ironpowder_Submissions 
        (lot_no, form_type, submitted_by, status, report_date, machine_name, total_input, total_output, diff_weight, form_data_json, created_at, updated_at)
        VALUES (@lotNo, @formType, @submittedBy, @status, @reportDate, @machineName, @totalInput, @totalOutput, @diffWeight, @formDataJson, GETDATE(), GETDATE())
        
        SELECT SCOPE_IDENTITY() as submissionId
    `);
```

**Database ตาราง `Form_Ironpowder_Submissions`:**

```
| submissionId | lot_no | form_type | submitted_by | status | report_date | machine_name | total_input | total_output | diff_weight | form_data_json | created_at | updated_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | IP-2024-001 | Ironpowder | 1 | Submitted | 2024-01-16 | Machine A | 100.00 | 90.00 | 10.00 | {...json...} | 2026-01-16 10:30 | 2026-01-16 10:30 |
```

#### 5.4 Commit Transaction

```javascript
const submissionId = result.recordset[0].submissionId; // ✅ ได้ submissionId = 1
await transaction.commit(); // ✅ บันทึกลงฐานข้อมูลจริง
```

#### 5.5 สร้าง Approval Flow

```javascript
// ✅ สร้าง approval flow asynchronously (ไม่ใช้ transaction)
const pool2 = await poolConnect;
await createApprovalFlow(pool2, submissionId, submittedBy);
```

---

## ✅ ขั้นตอนที่ 6: สร้าง Approval Flow

### `ironpowder.service.js` - Line 24-72

#### 6.1 ดึง User Level

```javascript
const userLevel = await ironpowderRepo.getUserApprovalLevel(pool, submittedBy);
// ✅ Query: SELECT LV_Approvals FROM Users WHERE user_id = 1
// ✅ ผลลัพธ์: userLevel = 0 (เช่น Operator)
```

#### 6.2 สร้าง Flow Steps ตามระดับผู้ใช้

```javascript
const flowSteps = [];
if (userLevel === 0) {
  // ✅ Operator ต้องอนุมัติจาก Level 1, 2, 3
  flowSteps.push({ sequence: 1, required_level: 1 });
  flowSteps.push({ sequence: 2, required_level: 2 });
  flowSteps.push({ sequence: 3, required_level: 3 });
} else if (userLevel === 1) {
  // ✅ Supervisor ต้องอนุมัติจาก Level 2, 3
  flowSteps.push({ sequence: 1, required_level: 2 });
  flowSteps.push({ sequence: 2, required_level: 3 });
} else if (userLevel === 2) {
  // ✅ Manager ต้องอนุมัติจาก Level 3
  flowSteps.push({ sequence: 1, required_level: 3 });
}
```

#### 6.3 INSERT ลง Gen_Approval_Flow

```javascript
for (const step of flowSteps) {
  await transaction
    .request()
    .input("submissionId", sql.Int, 1) // ✅ submissionId
    .input("sequence", sql.Int, step.sequence) // ✅ 1, 2, 3
    .input("requiredLevel", sql.Int, step.required_level) // ✅ 1, 2, 3
    .input("status", sql.NVarChar, "Pending") // ✅ "Pending"
    .query(`
            INSERT INTO Gen_Approval_Flow 
            (submission_id, sequence, required_level, status)
            VALUES (@submissionId, @sequence, @requiredLevel, @status)
        `);
}
```

**Database ตาราง `Gen_Approval_Flow`:**

```
| id | submission_id | sequence | required_level | status |
|---|---|---|---|---|
| 101 | 1 | 1 | 1 | Pending |
| 102 | 1 | 2 | 2 | Pending |
| 103 | 1 | 3 | 3 | Pending |
```

---

## ✅ ขั้นตอนที่ 7: Response & Navigation

### Controller Return (201 Created)

```javascript
res.status(201).send({
  message: "Ironpowder form submitted successfully!",
  submissionId: 1,
});
```

### Frontend Hook Processing

```typescript
const result = await ironpowderService.createIronpowder(ironpowderPayload);
// ✅ result = { message: "...", submissionId: 1 }

fireToast("success", `บันทึกร่าง Ironpowder สำเร็จ! (ID: 1)`);
// ✅ แสดง Toast notification

navigate("/reports/history/recycle", {
  state: { highlightedId: 1 },
});
// ✅ Navigate ไปหน้า History + highlight record ที่เพิ่มมา
```

---

## 📊 ตาราง Summary - จุดเเต่ละขั้นตอน

| ขั้นตอน | Location                 | Action                    | Status | Result                               |
| ------- | ------------------------ | ------------------------- | ------ | ------------------------------------ |
| 1       | Ironpowder_index.tsx     | Click "Draft"             | ✅     | onDraft callback                     |
| 2       | useProductionForm.ts     | handleDraftSubmit()       | ✅     | Collect form data                    |
| 3       | ironpowder.service.ts    | POST /api/ironpowder      | ✅     | HTTP request sent                    |
| 4       | ironpowder.routes.js     | validate()                | ✅     | Payload validated                    |
| 5       | ironpowder.controller.js | createIronpowder()        | ✅     | Check duplicate lot_no               |
| 6       | ironpowder.service.js    | createIronpowder()        | ✅     | INSERT record                        |
| 6.5     | ironpowder.service.js    | createApprovalFlow()      | ✅     | CREATE approval steps                |
| 7       | ironpowder.repository.js | getUserApprovalLevel()    | ✅     | Fetch user level                     |
| 8       | ironpowder.repository.js | createApprovalFlowSteps() | ✅     | INSERT flow steps                    |
| 9       | Frontend Hook            | fireToast()               | ✅     | Show success message                 |
| 10      | Frontend Hook            | navigate()                | ✅     | Redirect to /reports/history/recycle |

---

## 🚨 Potential Error Scenarios

### ❌ Error 1: Missing Lot No

```
Frontend: data.basicData.lotNo = undefined
→ Controller: 400 Bad Request
→ Hook catch: fireToast('error', 'บันทึกร่างไม่สำเร็จ: Missing required fields.')
```

### ❌ Error 2: Duplicate Lot No

```
Database: lot_no = 'IP-2024-001' already exists
→ Controller: 409 Conflict
→ Hook catch: fireToast('error', 'บันทึกร่างไม่สำเร็จ: Lot No มีอยู่ในระบบแล้ว')
```

### ❌ Error 3: Network Error

```
Frontend: API call fails
→ Catch block: fireToast('error', 'บันทึกร่างไม่สำเร็จ: Network error')
```

### ❌ Error 4: User Not Found

```
Repository: User ID not found in Users table
→ Service: console.error + approval flow not created
→ Record สร้างได้แต่ไม่มี approval flow
```

---

## ✨ Success Scenario (Happy Path)

```
🎯 User clicks "Draft"
  ↓
✅ Form data collected (getValues)
  ↓
✅ Payload created: { lotNo, formData, submittedBy }
  ↓
✅ API POST /api/ironpowder
  ↓
✅ Controller validates payload
  ↓
✅ Check duplicate lot_no (NOT found)
  ↓
✅ Service: BEGIN TRANSACTION
  ↓
✅ Extract key metrics (totalInput, totalOutput, etc.)
  ↓
✅ INSERT Form_Ironpowder_Submissions
  ↓
✅ COMMIT TRANSACTION
  ↓
✅ Get submissionId = 1
  ↓
✅ Service: BEGIN TRANSACTION (approval flow)
  ↓
✅ Get user level = 0
  ↓
✅ Create flow steps for levels [1, 2, 3]
  ↓
✅ INSERT Gen_Approval_Flow (3 records)
  ↓
✅ COMMIT TRANSACTION
  ↓
✅ Return 201 Created { submissionId: 1 }
  ↓
✅ Frontend: fireToast success
  ↓
✅ Navigate to /reports/history/recycle
  ↓
✅ Record appears in history with "Submitted" status
```

---

## 📝 Console Logs ที่คุณจะเห็น

**Backend Console:**

```
[Ironpowder] Successfully created ironpowder ID: 1
[Approval] Creating flow for submissionId: 1, By: 1
[Approval] User Level is: 0
[Repo] Created 3 approval flow steps
[Approval] Successfully created 3 approval steps.
```

**Frontend Console:**

```
POST /api/ironpowder → 201 Created
Response: { message: "...", submissionId: 1 }
Navigation: /reports/history/recycle
```

---

## ✅ Checklist - สิ่งที่เกิดขึ้น

- ✅ ปุ่มเปลี่ยนเป็น disabled
- ✅ ข้อความเปลี่ยนเป็น "กำลังบันทึก..."
- ✅ ฟอร์มไม่ validate (ใช้ getValues)
- ✅ API POST ไป /api/ironpowder
- ✅ Payload validation ที่ backend
- ✅ Duplicate lot_no check
- ✅ Transaction สร้าง + commit
- ✅ Key metrics extract
- ✅ Record INSERT ลง Form_Ironpowder_Submissions
- ✅ User level fetch
- ✅ Approval flow steps สร้าง
- ✅ Gen_Approval_Flow records INSERT
- ✅ Response 201 Created กลับมา
- ✅ Toast success แสดง
- ✅ Navigate ไป /reports/history/recycle
- ✅ ปุ่มกลับ enabled

---

**สรุป:** ระบบ Draft feature ทำงานครบถ้วนตามสถาปัตยกรรม ✅
