# 🚀 Deployment Guide (Performance Optimized / Node.js Edition)

เอกสารนี้จะแนะนำวิธีการนำระบบขึ้น Server จริง โดยใช้ **Node.js** (Version 16+)
**หมายเหตุ:** เนื่องจาก Windows Server ของคุณไม่รองรับ Bun เราจึงใช้ Node.js แทน แต่ยังคงความเร็วด้วยการจูนประสิทธิภาพโค้ดระดับสูงครับ

---

## 1. เตรียมเครื่อง Server (Windows Server)

### 1.1 ติดตั้ง Node.js

1. ไปที่ [Node.js Download](https://nodejs.org/)
2. ดาวน์โหลดและติดตั้งเวอร์ชัน **LTS** (Recommended)
3. ติดตั้งเสร็จ เปิด PowerShell พิมพ์เช็ค:
   ```powershell
   node --version
   npm --version
   ```

---

## 2. Deploy Backend (ฝั่ง Server / API)

### 2.1 ดึงโค้ดล่าสุด

ไปที่โฟลเดอร์โปรเจกต์บน Server แล้วดึงโค้ดล่าสุดจาก GitHub:

```bash
cd C:\path\to\project
git pull origin main
```

### 2.2 ติดตั้ง Dependencies (ด้วย npm)

```bash
cd backend
npm install
```

### 2.3 ตั้งค่า Environment (.env)

ตรวจสอบไฟล์ `.env` ในโฟลเดอร์ `backend` ว่าค่าถูกต้อง:

```ini
DB_USER=...
DB_PASSWORD=...
DB_SERVER=...
DB_DATABASE=AGT_SMART_SY
PORT=4000
JWT_SECRET=...
```

### 2.4 รัน Database Indexing (ครั้งแรกครั้งเดียว) 🔥

รันคำสั่งนี้เพื่อสร้าง "สารบัญ" ให้ Database ค้นหาข้อมูลเร็วๆ:

```bash
node scripts/run_indexes.js
```

### 2.5 เริ่มต้น Server (Start) 🚀

เริ่มระบบด้วยคำสั่ง:

```bash
npm start
```

_หน้าจอควรขึ้นว่า:_

> Backend server is running on http://localhost:4000
> Database Connected!
> Socket.io is ready!

---

## 3. Deploy Frontend (ฝั่งหน้าเว็บ)

### 3.1 สร้างไฟล์ Production Build

```bash
cd ../frontend
npm install
npm run build
```

### 3.2 นำไฟล์ไปวาง (Hosting)

นำไฟล์จากโฟลเดอร์ `frontend/dist` ไปวางที่ Web Server (IIS / Nginx / Shared Folder)

---

## 4. การตั้งค่า IIS Reverse Proxy (สำคัญมาก!) 🌐

เพื่อให้ Frontend เรียก API และ Socket ได้ถูกต้อง ผ่าน Port 81:

1.  **Install URL Rewrite Module:**
    - ดาวน์โหลดและติดตั้ง [IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
2.  **Config URL Rewrite Rules:**
    - ไปที่ Site genmatsu บน IIS
    - เปิดเมนู **URL Rewrite**
    - สร้าง Rule ใหม่ (Blank Rule):
      - **Name:** `ReverseProxyApi`
      - **Pattern:** `genmatsu/api/(.*)`
      - **Rewrite URL:** `http://localhost:4000/api/{R:1}`
      - **Check:** Stop processing of subsequent rules

3.  **Config Web Socket Protocol:**
    - ไปที่ Server Manager > Add Roles and Features
    - Web Server (IIS) > Application Development > **WebSocket Protocol**
    - (ถ้ายังไม่ได้ติ๊ก ให้ติ๊กแล้ว Install)

---

## 5. การดูแลรักษา (Maintenance)

### เทคนิคการรันแบบ Production (Service)

ใช้ **PM2** เพื่อให้ Backend ทำงานตลอดเวลา:

```bash
npm install -g pm2
cd backend

# create ecosystem.config.js (Optional but good) or just start:
pm2 start src/app.js --name "genmatsu-prod"
pm2 save
pm2 startup
```

### คำสั่งที่ใช้บ่อย:

- `pm2 list` : ดูสถานะ
- `pm2 restart genmatsu-prod` : รีสตาร์ท Server (ทำทุกครั้งที่แก้ Backend)
- `pm2 logs genmatsu-prod` : ดู Log การทำงาน (ถ้ามี Error)

---

## Check List ก่อนจบงาน ✅

1. [ ] ติดตั้ง Node.js 16+ แล้ว
2. [ ] Config IIS URL Rewrite ถูกต้อง (`/genmatsu/api` -> `http://localhost:4000/api`)
3. [ ] Config IIS WebSocket Protocol แล้ว
4. [ ] Backend รันบน PM2 สถานะ Online
5. [ ] หน้าเว็บใช้งานได้ ไม่ขึ้น Error แดงๆ ใน Console
6. [ ] PDF พิมพ์ได้ปกติ (ไม่ต้องสนใจคำเตือน insecure blob)
