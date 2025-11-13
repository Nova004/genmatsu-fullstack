
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById, generatePdfById } from '../../services/submissionService';
import { fireToast } from '../../hooks/fireToast';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';


// -- Import Component แบบปกติ --
import ReportDetailBZ from './BZ/ReportDetailBZ';
import ReportDetailBS_B from './BS-B/ReportDetailBS-B';
import ReportDetailBZ3 from './BZ3/ReportDetailBZ3';
import ReportDetailBS3 from './BS3/ReportDetailBS3';
import ReportDetailBZ5_C from './BZ5-C/ReportDetailBZ5-C';
import ReportDetailBS5_C from './BS5-C/ReportDetailBS5-C';

import ReportDetailAS2 from './AS2/ReportDetailAS2';
import ReportDetailAX9_B from './AX9-B/ReportDetailAX9-B';
import ReportDetailAX2_B from './AX2-B/ReportDetailAX2-B';

const ReportDetailDispatcher: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {

    if (!id) {
      console.error('[Dispatcher] Error: No ID found in URL.');
      setError("ไม่พบ ID ใน URL");
      setIsLoading(false);
      return;
    }
    const fetchDetails = async () => {
      console.log(`[Dispatcher] Attempting to fetch data for ID: ${id}`);
      try {
        const data = await getSubmissionById(id); // คืองการดึงข้อมูล submission
        setSubmissionData(data); // data ควรมีโครงสร้าง { submission: {...}, blueprints: [...] }
      } catch (err) {
        setError(`ไม่สามารถดึงข้อมูลสำหรับ ID: ${id} ได้`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // --- 👇 3. (เพิ่ม Function) สำหรับจัดการการกดปุ่ม Print PDF ---
  const handlePrintPdf = async () => {
    if (!id || isGeneratingPdf) return; // ป้องกันการกดซ้ำ

    setIsGeneratingPdf(true);
    console.log(`[Dispatcher] Initiating PDF generation for ID: ${id}`);
    try {
      const pdfBlob = await generatePdfById(id);

      // สร้าง URL ชั่วคราวจาก Blob
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));

      // เปิด PDF ในแท็บใหม่
      const link = document.createElement('a');
      link.href = url;
      // link.setAttribute('download', `report_${id}.pdf`); // ใช้บรรทัดนี้ถ้าต้องการให้ดาวน์โหลดเลย
      link.setAttribute('target', '_blank'); // เปิดในแท็บใหม่
      document.body.appendChild(link);
      link.click();

      console.log(`[Dispatcher] PDF opened in new tab for ID: ${id}`);

      // ลบ Link และ URL ชั่วคราวออกจากหน่วยความจำ (หลังจากเปิดแล้ว)
      link.parentNode?.removeChild(link);
      // หน่วงเวลาเล็กน้อยก่อน revoke เพื่อให้แน่ใจว่าแท็บใหม่เปิดทัน
      setTimeout(() => window.URL.revokeObjectURL(url), 100);

    } catch (err: any) {
      console.error(`[Dispatcher] Failed to generate PDF for ID ${id}:`, err);
      fireToast('error', `สร้าง PDF ไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
      console.log(`[Dispatcher] PDF generation process finished for ID: ${id}`);
    }
  };
  // --- สิ้นสุด Function handlePrintPdf ---


  const renderFormDetail = () => { // ฟังก์ชันนี้จะเลือก Component ที่จะเรนเดอร์ตาม form_type 

    if (!submissionData) return <div>No submission data to render.</div>;

    const { submission, blueprints } = submissionData;

    switch (submission.form_type) {
      case 'BZ':
        return <ReportDetailBZ submission={submission} blueprints={blueprints} />;
      case 'BS-B':
        return <ReportDetailBS_B submission={submission} blueprints={blueprints} />;
      case 'BZ3':
        return <ReportDetailBZ3 submission={submission} blueprints={blueprints} />;
      case 'BS3':
        return <ReportDetailBS3 submission={submission} blueprints={blueprints} />;
      case 'BZ5-C':
        return <ReportDetailBZ5_C submission={submission} blueprints={blueprints} />;
      case 'BS5-C':
        return <ReportDetailBS5_C submission={submission} blueprints={blueprints} />;
      case 'AS2':
        return <ReportDetailAS2 submission={submission} blueprints={blueprints} />;
      case 'AX9-B':
        return <ReportDetailAX9_B submission={submission} blueprints={blueprints} />;
      case 'AX2-B':
        return <ReportDetailAX2_B submission={submission} blueprints={blueprints} />;
      default:
        return <div>ไม่พบ Component สำหรับ Form Type: {submission.form_type}</div>;

    }
  };


  if (isLoading) {
    return <><div className="text-center p-4">กำลังโหลดรายละเอียด...</div></>;
  }
  if (error) {
    return <><div className="text-center p-4 text-red-500">{error}</div></>;
  }

  return (
    <>
      <Breadcrumb pageName={`ใบรายงานการผลิต: ${submissionData?.submission?.form_type || ''}`} />
      <div className="mb-4 flex justify-end">
        <button
          onClick={handlePrintPdf}
          disabled={isGeneratingPdf} // ปิดปุ่มตอนกำลังโหลด PDF
          className={`flex items-center justify-center rounded bg-primary py-2 px-4 font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-50`}
        >
          {isGeneratingPdf ? (
            <>
              {/* ไอคอน Loading หมุนๆ */}
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังสร้าง PDF...
            </>
          ) : (
            '📄 พิมพ์ PDF' // ข้อความปกติ
          )}
        </button>
      </div>
      <div>
        {renderFormDetail()}
      </div>
    </>
  );
};

export default ReportDetailDispatcher;