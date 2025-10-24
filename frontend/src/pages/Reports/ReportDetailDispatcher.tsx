// path: frontend/src/pages/Reports/ReportDetailDispatcher.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
// 👇 Import Service (ตรวจสอบ path ให้ถูกต้องตามโครงสร้างของคุณ)
import { getSubmissionById, getSubmissionPdf } from '../../services/submissionService';
import Loader from '../../common/Loader';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

// -- Import Component ลูกๆ สำหรับแสดงรายละเอียดของแต่ละ Form Type --
// (ตรวจสอบ path ให้ถูกต้อง)
import ReportDetailBZ from './BZ/ReportDetailBZ';
import ReportDetailBZ3 from './BZ3/ReportDetailBZ3';
import ReportDetailBS3 from './BS3/ReportDetailBS3';
import ReportDetailAS2 from './AS2/ReportDetailAS2';
import ReportDetailBZ5_C from './BZ5-C/ReportDetailBZ5-C'; // ชื่อไฟล์อาจจะเป็น BZ5-C หรือ BZ5_C
import ReportDetailBS5_C from './BS5-C/ReportDetailBS5-C'; // ชื่อไฟล์อาจจะเป็น BS5-C หรือ BS5_C

// (ถ้าจำเป็น) สร้าง Interface สำหรับ submissionData (ควรมี type ที่แน่นอน)
interface SubmissionData {
  submission: {
    id: number;
    lot_no: string;
    form_type: string;
    // ... fields อื่นๆ ของ Form_Submissions
    form_data_json: any; // ควรสร้าง Type ที่ละเอียดกว่านี้
  };
  blueprints: any; // ควรสร้าง Type ที่ละเอียดกว่านี้
}

const ReportDetailDispatcher: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // ดึง ID จาก URL
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null); // State เก็บข้อมูลที่ดึงมา
  const [isLoading, setIsLoading] = useState<boolean>(true); // State โหลดข้อมูลครั้งแรก
  const [error, setError] = useState<string | null>(null); // State เก็บ Error

  // ✨ State สำหรับปุ่มดาวน์โหลด PDF ✨
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // ✨ ตรวจสอบ Print Mode จาก URL (?print=true) ✨
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isPrintMode = queryParams.get('print') === 'true';

  // --- Effect สำหรับดึงข้อมูล Submission ตอนเปิดหน้า ---
  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) {
        setError("Submission ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true); // เริ่มโหลด
      setError(null); // เคลียร์ Error เก่า
      console.log(`[ReportDetailDispatcher] Fetching data for ID: ${id}`);
      try {
        const data = await getSubmissionById(id); // เรียก Service
        console.log('[ReportDetailDispatcher] Data received:', data);
        setSubmissionData(data); // เก็บข้อมูลใน State
      } catch (err: any) {
        console.error('[ReportDetailDispatcher] Error fetching data:', err);
        setError(err.message || 'Failed to fetch submission details.');
      } finally {
        setIsLoading(false); // โหลดเสร็จ (ไม่ว่าสำเร็จหรือพลาด)
      }
    };

    fetchDetails();
  }, [id]); // ทำงานใหม่เมื่อ id เปลี่ยน

  // ✨ =========================================== ✨
  // ✨ ฟังก์ชัน Handler สำหรับจัดการการดาวน์โหลด PDF ✨
  // ✨ =========================================== ✨
  const handleDownloadPdf = async () => {
    if (!id) {
      console.error('[PDF Download] Submission ID is missing.');
      alert('ไม่พบ ID ของรายงาน');
      return;
    }

    console.log(`[PDF Download] Button clicked for ID: ${id}`);
    setIsDownloading(true); // เริ่ม Loading ปุ่ม

    try {
      console.log('[PDF Download] Calling getSubmissionPdf service...');
      const response = await getSubmissionPdf(id); // เรียก Service ขอไฟล์ PDF

      // ตรวจสอบว่า API คืน Blob มาจริงไหม
      if (!(response.data instanceof Blob)) {
        console.error('[PDF Download] Error: Response is not a Blob.', response);
        throw new Error('Response received from server was not a PDF file.');
      }
      console.log(`[PDF Download] Received Blob. Size: ${response.data.size} bytes. Type: ${response.data.type}`);

      // สร้าง URL ชั่วคราวจาก Blob ที่ได้
      const pdfBlob = response.data;
      const url = window.URL.createObjectURL(pdfBlob);
      console.log(`[PDF Download] Created Blob URL: ${url}`);

      // สร้าง Element Link <a> ชั่วคราว
      const link = document.createElement('a');
      link.href = url;

      // ดึงชื่อไฟล์จาก Header 'content-disposition' ที่ Backend ส่งมา
      const contentDisposition = response.headers['content-disposition'];
      // ตั้งชื่อไฟล์ Default โดยใช้ Lot No จาก State `submissionData` (ถ้ามี)
      let fileName = `Report_${submissionData?.submission?.lot_no || id}.pdf`;
      console.log(`[PDF Download] Default Filename: ${fileName}`);
      console.log(`[PDF Download] Content-Disposition Header: ${contentDisposition}`);

      if (contentDisposition) {
        // ลองดึงชื่อไฟล์จาก Header (รองรับ UTF-8 และเครื่องหมายคำพูด)
        const fileNameMatch = contentDisposition.match(/filename\*?=['"]?([^'";]+)['"]?/);
        if (fileNameMatch && fileNameMatch[1]) {
          try {
            // Decode ชื่อไฟล์ (สำคัญสำหรับภาษาไทย)
            fileName = decodeURIComponent(fileNameMatch[1]);
            console.log(`[PDF Download] Extracted filename from header: ${fileName}`);
          } catch (e) {
            console.warn('[PDF Download] Could not decode filename, using raw match:', fileNameMatch[1]);
            fileName = fileNameMatch[1]; // ใช้ชื่อดิบๆ ถ้า Decode ไม่ได้
          }
        } else {
          console.warn('[PDF Download] Could not extract filename from Content-Disposition header.');
        }
      } else {
        console.warn('[PDF Download] Content-Disposition header not found in response.');
      }

      link.setAttribute('download', fileName); // ตั้งชื่อไฟล์ที่จะให้ User เห็นตอนโหลด

      // เพิ่ม Link เข้าไปในหน้าเว็บ (จำเป็นก่อนสั่ง click)
      document.body.appendChild(link);
      console.log('[PDF Download] Simulating click on download link...');
      // สั่งให้ Browser คลิก Link นี้ -> เริ่มดาวน์โหลด
      link.click();

      // ทำความสะอาด: ลบ Link และ URL ชั่วคราวออกจากหน่วยความจำ
      console.log('[PDF Download] Cleaning up temporary link and Blob URL...');
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url); // คืน Memory ให้ Browser

      console.log(`[PDF Download] Download initiated successfully for ID: ${id}`);

    } catch (error: any) {
      console.error(`[PDF Download] Error during PDF download process for ID ${id}:`, error);
      // แสดงข้อความ Error ให้ User (ใช้ Toast หรือ Modal จะดีกว่า alert)
      alert(`เกิดข้อผิดพลาดในการดาวน์โหลด PDF: ${error.message || 'ไม่ทราบสาเหตุ'}`);
    } finally {
      setIsDownloading(false); // สิ้นสุด Loading ปุ่มเสมอ
      console.log(`[PDF Download] Finished process for ID: ${id}. isDownloading set to false.`);
    }
  };


  // --- ฟังก์ชันเลือก Component ลูกที่จะ Render ---
  const renderFormDetail = () => {
    // ตรวจสอบก่อนว่ามีข้อมูลไหม
    if (!submissionData) return <div className="text-center p-4">ไม่พบข้อมูลรายงาน</div>;

    // ส่ง props ที่จำเป็นลงไปให้ Component ลูก
    // isReadOnly={true} เพราะนี่คือหน้าดูรายละเอียด
    // isPrintMode บอกให้ Component ลูกรู้ว่ากำลังอยู่ในโหมด Print (เผื่อต้องซ่อนอะไรเพิ่ม)
    const props = {
      submission: submissionData.submission, // ข้อมูลที่ User กรอก
      blueprints: submissionData.blueprints, // พิมพ์เขียวเวอร์ชันที่ใช้
      isReadOnly: true,
      isPrintMode: isPrintMode
    };

    // ใช้ switch case เลือก Component ตาม submission.form_type
    switch (submissionData.submission.form_type) {
      case 'BZ': // 📌 ชื่อ Form Type ต้องตรงกับที่เก็บใน Database
        return <ReportDetailBZ {...props} />;
      case 'BZ3':
        return <ReportDetailBZ3 {...props} />;
      case 'BS3':
        return <ReportDetailBS3 {...props} />;
      case 'BZ5-C':
        return <ReportDetailBZ5_C {...props} />;
      case 'BS5-C':
        return <ReportDetailBS5_C {...props} />;
      case 'AS2':
        return <ReportDetailAS2 {...props} />;
      // เพิ่ม case สำหรับ Form Type อื่นๆ ที่คุณมี
      default:
        return <div className="text-center p-4 text-red-500">ไม่รู้จัก Form Type: {submissionData.submission.form_type}</div>;
    }
  };

  // --- ส่วนแสดงผลหลัก ---
  if (isLoading) {
    return <Loader />; // แสดง Loader ขณะรอข้อมูล
  }

  if (error) {
    // แสดง Error ถ้าดึงข้อมูลไม่ได้
    return (
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <Breadcrumb pageName="Error" />
        <p className="text-center text-red-500">{error}</p>
        <div className="mt-4 flex justify-center">
          <Link to="/reports/history-gen-b" // 📌 แก้ Path กลับหน้า History
            className="flex items-center justify-center rounded bg-gray-2 px-6 py-2 font-medium text-black hover:bg-opacity-90 dark:bg-meta-4 dark:text-white">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  if (!submissionData) {
    // แสดงข้อความถ้าไม่พบข้อมูล (อาจเกิดขึ้นได้ถ้า ID ผิด)
    return (
      <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <Breadcrumb pageName="Not Found" />
        <p className="text-center">ไม่พบข้อมูลรายงานสำหรับ ID: {id}</p>
        <div className="mt-4 flex justify-center">
          <Link to="/reports/history-gen-b" // 📌 แก้ Path กลับหน้า History
            className="flex items-center justify-center rounded bg-gray-2 px-6 py-2 font-medium text-black hover:bg-opacity-90 dark:bg-meta-4 dark:text-white">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  // --- แสดงผลปกติเมื่อมีข้อมูล ---
  return (
    <>
      {/* Breadcrumb (จะไม่แสดงใน Print Mode) */}
      {!isPrintMode && (
        <Breadcrumb pageName={`Report Detail: Lot ${submissionData.submission.lot_no || id}`} />
      )}


      {/* เรียกฟังก์ชัน renderFormDetail เพื่อแสดง Component ลูก */}
      {renderFormDetail()}

      {/* ✨ ปุ่ม Back และ Download PDF (จะไม่แสดงใน Print Mode) ✨ */}
      {!isPrintMode && (
        <div className="mt-6 mb-4 flex justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark">
          <Link
            to="/reports/history-gen-b" // 📌 แก้ Path กลับหน้า History ให้ถูกต้อง
            className="flex items-center justify-center rounded bg-gray-2 px-6 py-2 font-medium text-black hover:bg-opacity-90 dark:bg-meta-4 dark:text-white"
          >
            Back
          </Link>
          <button
            onClick={handleDownloadPdf} // ผูกกับฟังก์ชัน Handler
            disabled={isDownloading}    // Disable ตอนกำลังโหลด
            // ใช้ Tailwind CSS จัดสไตล์ปุ่ม (ปรับ Class ตาม Theme ของคุณ)
            className="flex items-center justify-center rounded bg-primary px-6 py-2 font-medium text-gray hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading ? ( // แสดง Spinner + ข้อความตอนโหลด
              <>
                {/* SVG Spinner */}
                <svg className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" viewBox="0 0 24 24"></svg>
                กำลังสร้าง PDF...
              </>
            ) : (
              'ดาวน์โหลด PDF' // ข้อความปกติ
            )}
          </button>
        </div>
      )}
    </>
  );
};

export default ReportDetailDispatcher;