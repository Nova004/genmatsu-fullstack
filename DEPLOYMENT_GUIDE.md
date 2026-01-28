# 🚀 Ironpowder Form - Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy the complete Ironpowder form system (frontend + backend + database).

---

## Prerequisites

- SQL Server Management Studio (SSMS) or SQL Server query tool
- Backend: Node.js running on port 4000
- Frontend: React running on port 5173 (or configured port)
- Database: SQL Server instance with Users table

---

## Deployment Steps

### Step 1: Create Database Table ⭐

**File to Execute:**

```
backend/database/Form_Ironpowder_Submissions.sql
```

**How to Execute:**

1. Open SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance
3. Open the SQL file: `backend/database/Form_Ironpowder_Submissions.sql`
4. Click **Execute** (F5)
5. Verify success message: "Ironpowder Form Database Setup Complete!"

**What Gets Created:**

- Table: `Form_Ironpowder_Submissions` (17 columns)
- Index: `IDX_Ironpowder_Status`
- Index: `IDX_Ironpowder_SubmittedBy`
- Index: `IDX_Ironpowder_CreatedAt`

**Verification:**

```sql
-- Check if table exists
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'Form_Ironpowder_Submissions';

-- Check table structure
EXEC sp_columns @table_name = 'Form_Ironpowder_Submissions';

-- Check indexes
SELECT * FROM sys.indexes
WHERE object_id = OBJECT_ID('Form_Ironpowder_Submissions');
```

---

### Step 2: Verify Backend Routes ✅

**Files Already Created:**

```
backend/src/
├── api/
│   └── ironpowder.routes.js
├── validators/
│   └── ironpowder.validator.js
├── controllers/
│   └── ironpowder.controller.js
├── services/
│   └── ironpowder.service.js
└── repositories/
    └── ironpowder.repository.js
```

**Routes Registered in app.js:**

```javascript
const ironpowderRoutes = require("./api/ironpowder.routes");
app.use("/api/ironpowder", ironpowderRoutes);
```

**Status:** ✅ Already integrated

---

### Step 3: Start Backend Server

```bash
cd backend
npm install
npm start
```

**Expected Console Output:**

```
Server running on port 4000
Database connected
```

**Verify API Endpoints:**

```bash
# Test basic endpoint
curl http://localhost:4000/api/ironpowder

# Expected response: [] (empty array)
```

---

### Step 4: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**

```
VITE v5.x.x running at:
  ➜  Local:   http://localhost:5173/
```

---

### Step 5: Test the Form

#### Navigate to Ironpowder Form

1. Open browser: `http://localhost:5173/`
2. Navigate to: Forms → Recycle → Ironpowder

#### Create a New Submission

1. **Fill Basic Info** (Step 1)
   - Lot No: (must be unique)
   - Date: Today's date
   - Machine Name: Enter any value
2. **Fill Input Product Table**
   - Add rows as needed
   - Enter pallet number, area, weight
3. **Fill Output Tables**
   - Output Genmatsu A, B
   - Output Film Product
   - Output PE Bag
   - Output Dust Collector
   - Output Cleaning
4. **Review Summary**
   - Check Total Input/Output/Diff calculations

5. **Click "บันทึก" (Save)**
   - Should show: "บันทึกข้อมูล Ironpowder สำเร็จ! (ID: 1)"
   - Should navigate to: `/reports/history/recycle`

#### Verify Database

```sql
-- Check if record was saved
SELECT submissionId, lot_no, status, submitted_by
FROM Form_Ironpowder_Submissions
ORDER BY created_at DESC;

-- Check approval flow was created
SELECT * FROM Gen_Approval_Flow
WHERE submission_id = 1 AND form_type = 'Ironpowder'
ORDER BY sequence;
```

---

## API Testing with Postman

### Test Endpoints

#### 1. Create Submission

**POST** `http://localhost:4000/api/ironpowder`

```json
{
  "lotNo": "IP-2024-001",
  "formData": {
    "basicData": {
      "lotNo": "IP-2024-001",
      "date": "2024-01-15",
      "machineName": "Machine A"
    },
    "inputProduct": [
      {
        "palletNo": "P001",
        "areaNo": "A1",
        "weight": 50.5
      }
    ],
    "outputGenmatsuA": [
      {
        "canNo": 1,
        "temperature": 180,
        "weight": 75
      }
    ],
    "summary": {
      "totalInput": 50.5,
      "totalOutput": 75,
      "diffWeight": -24.5
    }
  },
  "submittedBy": 1
}
```

**Expected Response (201 Created):**

```json
{
  "success": true,
  "message": "Ironpowder submission created successfully",
  "submissionId": 1,
  "lot_no": "IP-2024-001",
  "status": "Draft",
  "approvalFlow": [
    {
      "sequence": 1,
      "required_level": 1,
      "status": "pending"
    }
  ]
}
```

#### 2. Get All Submissions

**GET** `http://localhost:4000/api/ironpowder?page=1&limit=10`

**Expected Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "submissionId": 1,
      "lot_no": "IP-2024-001",
      "status": "Draft",
      "submitted_by": 1,
      "total_input": 50.5,
      "total_output": 75,
      "diff_weight": -24.5,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### 3. Get Single Submission

**GET** `http://localhost:4000/api/ironpowder/1`

#### 4. Update Submission

**PUT** `http://localhost:4000/api/ironpowder/1`

#### 5. Delete Submission

**DELETE** `http://localhost:4000/api/ironpowder/1`

#### 6. Resubmit After Rejection

**PUT** `http://localhost:4000/api/ironpowder/1/resubmit`

---

## Common Issues & Solutions

### Issue 1: "Duplicate lot_no" Error

**Error Message:**

```json
{
  "success": false,
  "errorCode": "DUPLICATE_LOT",
  "message": "Lot number already exists"
}
```

**Solution:**

- Use a unique lot_no
- Each submission must have a different lot_no

### Issue 2: Database Connection Error

**Error Message:**

```
ELOGIN: Login failed for user 'sa'
```

**Solution:**

1. Check SQL Server is running
2. Verify connection string in `backend/src/config/db.config.js`
3. Ensure database user has proper permissions

### Issue 3: API Not Found

**Error Message:**

```
404 Not Found: /api/ironpowder
```

**Solution:**

1. Verify routes are registered in app.js
2. Restart backend server
3. Check console for import errors

### Issue 4: Frontend Not Calling API

**Symptoms:**

- Form doesn't save
- No network request in DevTools

**Solution:**

1. Check API service: `frontend/src/services/ironpowder.service.ts`
2. Verify hook integration: `frontend/src/hooks/useProductionForm.ts`
3. Check browser console for errors
4. Verify backend is running on port 4000

---

## Performance Optimization

### Database Indexes

Already created for fast queries:

- `IDX_Ironpowder_Status` - Filter by status
- `IDX_Ironpowder_SubmittedBy` - Filter by user
- `IDX_Ironpowder_CreatedAt` - Sort by date

### API Pagination

Supports pagination on GET list endpoint:

```
GET /api/ironpowder?page=1&limit=10
```

### JSON Storage

- Full form data stored in `form_data_json` (NVARCHAR(MAX))
- Key metrics in normalized columns for fast queries
- Enables complex filtering without JSON parsing

---

## Monitoring & Logging

### Backend Logs

Check for:

- Successful submissions: "Ironpowder submission created successfully"
- Duplicate errors: "Lot number already exists"
- Approval flow creation: "Approval flow created for submission"

### Database Logs

Monitor:

```sql
-- Recent submissions
SELECT TOP 10 * FROM Form_Ironpowder_Submissions
ORDER BY created_at DESC;

-- Pending approvals
SELECT * FROM Gen_Approval_Flow
WHERE form_type = 'Ironpowder' AND status = 'pending';

-- Approval actions
SELECT * FROM Gen_Approved_log
WHERE form_type = 'Ironpowder'
ORDER BY created_at DESC;
```

---

## Maintenance Tasks

### Weekly Checks

- Monitor API response times
- Check for failed submissions in logs
- Verify approval flow completion rates

### Monthly Maintenance

- Backup Form_Ironpowder_Submissions table
- Review and archive old submissions (status = 'Approved')
- Analyze slow queries and optimize indexes if needed

### Database Cleanup

```sql
-- Archive old approved submissions (example: older than 1 year)
-- BACKUP before running!
DELETE FROM Form_Ironpowder_Submissions
WHERE status = 'Approved'
AND created_at < DATEADD(YEAR, -1, GETDATE());
```

---

## Support & Documentation

### Key Files

- **Database Schema:** `backend/database/Form_Ironpowder_Submissions.sql`
- **API Routes:** `backend/src/api/ironpowder.routes.js`
- **Frontend Form:** `frontend/src/components/formGen/pages/Recycle/Ironpowder_index.tsx`
- **API Service:** `frontend/src/services/ironpowder.service.ts`
- **Hook Integration:** `frontend/src/hooks/useProductionForm.ts`

### Related Documentation

- Form variants: IronpowderFormEdit.tsx, IronpowderFormViewer.tsx, IronpowderFormPrint.tsx
- Approval workflow: Uses Gen_Approval_Flow and Gen_Approved_log tables
- User levels: Stored in Users.LV_Approvals column

---

## Success Criteria

✅ Form submits successfully  
✅ Data persists in database  
✅ Approval flow is created  
✅ User can view in history  
✅ Edit/Print/View modes work  
✅ API endpoints respond correctly  
✅ No console errors  
✅ Database queries perform well

---

**Deployment Status:** Ready to Deploy  
**Last Updated:** 2024  
**Version:** 1.0
