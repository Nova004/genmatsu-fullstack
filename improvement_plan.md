# Genmatsu Project Improvement Plan

จากการวิเคราะห์ Codebase ทั้ง Backend และ Frontend ผมขอเสนอแนวทางการปรับปรุงโปรเจกต์ให้ดียิ่งขึ้น โดยเน้นที่ความยั่งยืน (Maintainability), ประสิทธิภาพ (Performance), และมาตรฐานของโค้ด (Code Quality) ดังนี้ครับ:

## 1. Backend Improvements (Node.js/Express)

### 1.1 แยก Business Logic ออกจาก Controller (Service Layer Pattern)

**ปัญหา:** ปัจจุบัน `submission.controller.js` มีขนาดใหญ่มาก (God Object) ทำหน้าที่ทุกอย่างตั้งแต่ต่อ Database, สร้าง PDF, จัดการ Transaction, ไปจนถึง Business Logic
**แนวทางแก้ไข:**

- สร้าง **Service Layer** (`src/services/`) เพื่อรับผิดชอบ Business Logic โดยเฉพาะ
- Controller จะทำหน้าที่แค่รับ Request, เรียก Service, และส่ง Response เท่านั้น
- **ตัวอย่าง:** ย้าย Logic การสร้าง PDF ไปไว้ที่ `PdfService`, ย้าย Logic การอนุมัติไปที่ `ApprovalService`

### 1.2 จัดการ Database Query ให้เป็นระบบ (Repository Pattern / Data Access)

**ปัญหา:** SQL Query ฝังอยู่ใน Controller ทำให้แก้ไขยากและซ้ำซ้อน
**แนวทางแก้ไข:**

- แยก SQL Query ออกไปไว้ในไฟล์แยก หรือใช้ Model/Repository pattern
- ทำให้สามารถ Reuse Query ได้ง่ายขึ้น

### 1.3 Global Error Handling

**ปัญหา:** การจัดการ Error กระจายอยู่ตาม Controller แต่ละตัว (try-catch ซ้ำๆ)
**แนวทางแก้ไข:**

- สร้าง Middleware สำหรับจัดการ Error กลาง (`error.middleware.js`)
- ทำให้ Response Error มีรูปแบบมาตรฐานเดียวกันทั้งระบบ

### 1.4 Request Validation

**ปัญหา:** การตรวจสอบข้อมูล (Validation) ทำแบบ Manual ใน Controller (if !data ...)
**แนวทางแก้ไข:**

- ใช้ Library เช่น `Joi` หรือ `Zod` สร้าง Middleware เพื่อตรวจสอบข้อมูลก่อนเข้า Controller

---

## 2. Frontend Improvements (React/Vite)

### 2.1 Code Splitting & Lazy Loading

**ปัญหา:** `App.tsx` Import ทุก Page เข้ามาพร้อมกัน ทำให้ไฟล์ Bundle เริ่มต้นมีขนาดใหญ่ (Initial Load ช้า)
**แนวทางแก้ไข:**

- ใช้ `React.lazy()` และ `Suspense` เพื่อโหลดหน้าจอเมื่อจำเป็นต้องใช้เท่านั้น (Route-based splitting)

### 2.2 Dynamic Routing สำหรับ Form

**ปัญหา:** มีการประกาศ Route ซ้ำๆ สำหรับ Form แต่ละประเภท (`/forms/bz-form`, `/forms/bs-form`, ฯลฯ)
**แนวทางแก้ไข:**

- ใช้ Dynamic Route เช่น `/forms/:formType` และใช้ Component กลางที่ฉลาดพอจะโหลด Config หรือ Component ย่อยตาม `formType` ได้

### 2.3 Refactor `App.tsx`

**ปัญหา:** `App.tsx` มี Logic และ Route ที่ซับซ้อนและยาวมาก
**แนวทางแก้ไข:**

- แยก Route Configuration ออกไปเป็นไฟล์ `routes.tsx` หรือ `AppRoutes.tsx`
- จัดกลุ่ม Route ให้ชัดเจนขึ้น

---

## 3. General & DevOps

### 3.1 Type Safety (Backend)

**ปัญหา:** Backend เป็น JavaScript ล้วน ทำให้ไม่มี Type Checking อาจเกิด Runtime Error ได้ง่าย
**แนวทางแก้ไข:**

- (ระยะยาว) พิจารณาเปลี่ยนเป็น TypeScript หรือใช้ JSDoc อย่างเคร่งครัดเพื่อช่วยเรื่อง Type Hinting

### 3.2 Environment Variables Type Safety

**ปัญหา:** การเรียกใช้ `process.env` กระจายอยู่ทั่วไป
**แนวทางแก้ไข:**

- สร้างไฟล์ `config/env.js` (หรือ `config.ts`) เพื่อ Validate และ Export ค่า Config ทั้งหมดในที่เดียว

---

## Action Plan (ลำดับการทำงานที่แนะนำ)

1.  **Backend Refactoring (Priority High)**:
    - [ ] แยก `submission.controller.js` ออกเป็น Services (`SubmissionService`, `PdfService`)
    - [ ] สร้าง Global Error Handler
2.  **Frontend Optimization (Priority Medium)**:
    - [ ] ทำ Lazy Loading ใน `App.tsx`
    - [ ] Refactor Routing ให้สะอาดขึ้น
3.  **Code Quality (Ongoing)**:
    - [ ] เพิ่ม Comment และ Documentation ในส่วนที่ซับซ้อน

คุณเห็นด้วยกับแผนนี้ไหมครับ? หรืออยากให้ผมเริ่มที่ส่วนไหนก่อนเป็นพิเศษ? (แนะนำให้เริ่มที่ **Backend Refactoring** ก่อน เพราะ `submission.controller.js` ค่อนข้างซับซ้อนและสำคัญครับ)
