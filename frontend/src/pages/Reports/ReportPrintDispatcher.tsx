// frontend/src/pages/Reports/ReportPrintDispatcher.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById } from '../../services/submissionService';

// --- ⬇️ (สำคัญ) Import Component "สำหรับพิมพ์" ทั้งหมดที่คุณมี ⬇️ ---
// (คุณต้องสร้างไฟล์เหล่านี้ขึ้นมา โดยมี Layout สำหรับ A4)
import PrintableReportAS2 from './AS2/PrintableReportAS2';
import PrintableReportBZ5_C from './BZ5-C/PrintableReportBZ5-C';

// --- ⬆️ สิ้นสุดส่วน Import Component ⬆️ ---


// (ถ้ามี) สร้าง Interface/Type สำหรับ submissionData เพื่อความชัดเจน
interface SubmissionPrintData {
  submission: {
    id: number;
    lot_no: string;
    form_type: string;
    form_data_json: any; // ควรสร้าง Type ที่ละเอียดกว่านี้
  };
  blueprints: any; // ควรสร้าง Type ที่ละเอียดกว่านี้
}


const ReportPrintDispatcher: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // ⭐️ ใช้ Type ที่สร้างขึ้น (ถ้ามี)
  const [submissionData, setSubmissionData] = useState<SubmissionPrintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Loading Report ${id}...`; // << เพิ่มบรรทัดนี้
    if (!id) {
      console.error('[PrintDispatcher] Error: No ID found in URL.');
      setError('ไม่พบ ID ใน URL');
      setIsLoading(false);
      return; // หยุดการทำงานถ้าไม่มี ID
    }

    // --- เริ่มดึงข้อมูล ---
    const fetchDetails = async () => {
      console.log(`[PrintDispatcher] Attempting to fetch data for ID: ${id}`);
      setIsLoading(true); // ตั้งค่า Loading ก่อนเริ่ม fetch
      setError(null);     // เคลียร์ Error เก่า
      try {
        const data = await getSubmissionById(id);
        console.log(`[PrintDispatcher] Data fetched successfully for ID: ${id}`, data);
        setSubmissionData(data);
        document.title = `Report - ${data.submission.form_type} (${data.submission.lot_no})`;
      } catch (err: any) {
        console.error(`[PrintDispatcher] Error fetching submission ${id}:`, err);
        setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        document.title = `Error - Fetch Failed ${id}`;
      } finally {
        setIsLoading(false); // สิ้นสุด Loading เสมอ
      }
    };

    fetchDetails();
  }, [id]); // ทำงานใหม่เมื่อ id เปลี่ยน

  // --- ฟังก์ชันเลือก Component ลูกสำหรับพิมพ์ ---
  const renderPrintableForm = () => {
    // ⭐️ [แก้ไข] ย้าย Guard `!submissionData` มาไว้ตรงนี้
    // เพราะเราจะเรียกใช้ฟังก์ชันนี้หลังจากผ่าน Guard หลักแล้ว
    if (!submissionData) {
      console.error('[PrintDispatcher] renderPrintableForm called but submissionData is null.');
      return <div>Error: Cannot render report, submission data is missing.</div>;
    }

    const { submission, blueprints } = submissionData;

    // ⭐️ ส่ง props ลงไปให้ Component ลูก
    const props = { submission, blueprints };

    switch (submission.form_type) {
      // --- ⬇️ ตรวจสอบ Case และชื่อ Component ให้ตรงกับที่คุณ Import มา ⬇️ ---
      case 'AS2':
        return <PrintableReportAS2 {...props} />;
      case 'BZ5-C':
        return <PrintableReportBZ5_C {...props} />;
      // --- ⬆️ เพิ่ม Case อื่นๆ ถ้ามี ⬆️ ---
      default:
        console.error(`[PrintDispatcher] Unknown form_type: ${submission.form_type}`);
        // แสดง Error ลง PDF ไปเลยถ้าไม่รู้จัก Type
        return <div className="p-4 text-red-600">Error: ไม่รู้จัก Form Type สำหรับการพิมพ์: {submission.form_type}</div>;
    }
  };

  // --- ⭐️⭐️⭐️ [เกราะป้องกัน] (Safety Guards) ⭐️⭐️⭐️ ---

  // 1. ถ้ากำลังโหลด... แสดงหน้าขาว (Puppeteer จะรอจนผ่านจุดนี้เพราะ networkidle0)
  if (isLoading) {
    console.log(`[PrintDispatcher] ID: ${id} - Currently loading... Returning null.`);
    return <div id="pdf-status-loading">Loading report data...</div>;
  }

  // 2. ถ้าเกิด Error ตอน Fetch... แสดง Error (ลง PDF)
  if (error) {
    console.error(`[PrintDispatcher] ID: ${id} - Fetch error occurred. Rendering error message.`);
    return <div id="pdf-status-error">เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับพิมพ์: {error}</div>; // 👈 เพิ่ม ID
  }

  // 3. ถ้าไม่ Error แต่หาข้อมูลไม่เจอ... แสดงข้อความ (ลง PDF)
  if (!submissionData) {
    console.warn(`[PrintDispatcher] ID: ${id} - No submission data found after loading. Rendering 'not found' message.`);
    return <div id="pdf-status-notfound">ไม่พบข้อมูลรายงาน (ID: {id})</div>; // 👈 เพิ่ม ID
  }

  console.log(`[PrintDispatcher] ID: ${id} - Rendering printable form...`);
  // ‼️ [แก้ไข] ‼️
  // return <>{renderPrintableForm()}</>; // <--- ลบอันนี้ทิ้ง
  return (
    <div id="pdf-content-ready">
      {/* 👈 เพิ่ม ID นี้เพื่อเป็น "สัญญาณ" ว่าพร้อมพิมพ์ */}
      {renderPrintableForm()}
    </div>
  );
};

export default ReportPrintDispatcher;