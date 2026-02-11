
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById, generatePdfById } from '../../services/submissionService';
import { ironpowderService } from '../../services/ironpowder.service'; // Import Ironpowder Service
import { fireToast } from '../../hooks/fireToast';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { formatNumberRound, isNumeric } from '../../utils/utils';
import { EXCLUDED_DECIMAL_FIELDS } from './EXCLUDED_DECIMAL_FIELDS';


// -- Import Component แบบปกติ --
import ReportDetailBZ from './BZ/ReportDetailBZ';
import ReportDetailBS_B from './BS-B/ReportDetailBS-B';
import ReportDetailBS from './BS/ReportDetailBS';
import ReportDetailBN from './BN/ReportDetailBN';
import ReportDetailBZ3 from './BZ3/ReportDetailBZ3';
import ReportDetailBZ3_B from './BZ3-B/ReportDetailBZ3-B';
import ReportDetailBS3 from './BS3/ReportDetailBS3';
import ReportDetailBS3_B from './BS3-B/ReportDetailBS3-B';
import ReportDetailBS3_B1 from './BS3-B1/ReportDetailBS3-B1';
import ReportDetailBS3_C from './BS3-C/ReportDetailBS3-C';
import ReportDetailBZ5_C from './BZ5-C/ReportDetailBZ5-C';
import ReportDetailBS5_C from './BS5-C/ReportDetailBS5-C';
import ReportDetailAS2 from './AS2/ReportDetailAS2';
import ReportDetailAJ4 from './AJ4/ReportDetailAJ4';
import ReportDetailAS4 from './AS4/ReportDetailAS4';
import ReportDetailAS2_D from './AS2-D/ReportDetailAS2-D';
import ReportDetailAZ_D from './AZ-D/ReportDetailAZ-D';
import ReportDetailAZ1 from './AZ1/ReportDetailAZ1';
import ReportDetailAX9_B from './AX9-B/ReportDetailAX9-B';
import ReportDetailAX2_B from './AX2-B/ReportDetailAX2-B';
import ReportDetailAZ from './AZ/ReportDetailAZ';
import ReportDetailIronpowder from './Ironpowder/ReportDetailIronpowder'; // Import Component







const processTemplateData = (data: any, parentKey: string = ''): any => {
  if (Array.isArray(data)) {
    return data.map(item => processTemplateData(item, parentKey));
  }
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, val]) => {
        const currentPath = parentKey ? `${parentKey}.${key}` : key;

        if (isNumeric(val)) {
          // 1. เช็คว่าเป็น Field ที่ต้องยกเว้นหรือไม่
          const isExcluded = EXCLUDED_DECIMAL_FIELDS.some(excluded => {
            return currentPath === excluded ||
              currentPath.endsWith(`.${excluded}`) ||
              key === excluded;
          });

          // 🚩 2. แก้ไขตรงนี้: ลบ typeof val === 'string' ออก
          // "ถ้าอยู่ในลิสต์ยกเว้น ให้คืนค่าเดิมทันที (ไม่ว่าจะเป็น int, float หรือ string)"
          if (isExcluded) {
            return [key, val];
          }

          // ถ้าไม่ใช่ตัวยกเว้น ค่อยจับปัดเศษ
          return [key, formatNumberRound(val)];
        }

        return [key, processTemplateData(val, currentPath)];
      })
    );
  }
  return data;
};


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
        let data = await getSubmissionById(id).catch(() => null);

        // ถ้าหาไม่เจอในตารางหลัก ให้ลองหาใน Ironpowder Table
        if (!data) {
          const ironData: any = await ironpowderService.getIronpowderById(id).catch(() => null);
          if (ironData) {
            // Map Data ให้เหมือนกับ Structure ของ Submission ปกติ
            data = {
              submission: {
                ...ironData,
                submission_id: ironData.submissionId, // Map submissionId to submission_id
                form_type: 'Ironpowder',
                form_data_json: ironData.form_data_json || ironData.formData // Handle field mismatch
              },
              blueprints: {} // Ironpowder may not use blueprints in the same way, or fetch if needed
            };
          }
        }

        if (!data) {
          throw new Error("Submission not found");
        }


        // ✅ 4. ดักแปลงข้อมูล submission ให้มีทศนิยมสวยงามก่อน
        if (data && data.submission) {
          const processedSubmission = processTemplateData(data.submission);

          // อัปเดต state โดยใช้ submission ตัวใหม่ที่แปลงแล้ว
          setSubmissionData({
            ...data,
            submission: processedSubmission
          });
        } else {
          setSubmissionData(data);
        }
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
      case 'G014': // BZ
        return <ReportDetailBZ submission={submission} blueprints={blueprints} />;
      case 'G013': // BS-B
        return <ReportDetailBS_B submission={submission} blueprints={blueprints} />;
      case 'G012': // BS
        return <ReportDetailBS submission={submission} blueprints={blueprints} />;
      case 'G011': // BN
        return <ReportDetailBN submission={submission} blueprints={blueprints} />;
      case 'G015': // BZ3
        return <ReportDetailBZ3 submission={submission} blueprints={blueprints} />;
      case 'G016': // BZ3-B
        return <ReportDetailBZ3_B submission={submission} blueprints={blueprints} />;
      case 'G017': // BS3
        return <ReportDetailBS3 submission={submission} blueprints={blueprints} />;
      case 'G025': // BS3-C
        return <ReportDetailBS3_C submission={submission} blueprints={blueprints} />;
      case 'G010': // BS3-B
        return <ReportDetailBS3_B submission={submission} blueprints={blueprints} />;
      case 'G030': // BS3-B1
        return <ReportDetailBS3_B1 submission={submission} blueprints={blueprints} />;
      case 'G028': // BZ5-C
        return <ReportDetailBZ5_C submission={submission} blueprints={blueprints} />;
      case 'G029': // BS5-C
        return <ReportDetailBS5_C submission={submission} blueprints={blueprints} />;
      case 'G001': // AS2
        return <ReportDetailAS2 submission={submission} blueprints={blueprints} />;
      case 'G006': // AJ4
        return <ReportDetailAJ4 submission={submission} blueprints={blueprints} />;
      case 'G007': // AS4
        return <ReportDetailAS4 submission={submission} blueprints={blueprints} />;
      case 'G009': // AS2-D
        return <ReportDetailAS2_D submission={submission} blueprints={blueprints} />;
      case 'G020': // AZ-D
        return <ReportDetailAZ_D submission={submission} blueprints={blueprints} />;
      case 'G022': // AZ1
        return <ReportDetailAZ1 submission={submission} blueprints={blueprints} />;
      case 'G021': // AX9-B
        return <ReportDetailAX9_B submission={submission} blueprints={blueprints} />;
      case 'G002': // AX2-B
        return <ReportDetailAX2_B submission={submission} blueprints={blueprints} />;
      case 'G004': // AZ
        return <ReportDetailAZ submission={submission} blueprints={blueprints} />;
      case 'Ironpowder':
        return <ReportDetailIronpowder submission={submission} blueprints={blueprints} />;
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
      <Breadcrumb pageName={`ใบรายงานการผลิต: ${(submissionData?.submission?.category || 'Recycle').replace('_', ' ')}`} />
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