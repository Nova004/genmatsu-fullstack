// frontend/src/pages/Reports/ReportPrintDispatcher.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById } from '../../services/submissionService';

// --- ⬇️ เราจะเปลี่ยนไป Import "Component สำหรับพิมพ์" (ที่เรากำลังจะสร้าง) ---

import PrintableReportAS2 from './AS2/PrintableReportAS2';

// --- ⬆️ สิ้นสุดส่วน Import Component ---

const ReportPrintDispatcher: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      console.error('[PrintDispatcher] Error: No ID found in URL.');
      setError('ไม่พบ ID ใน URL');
      setIsLoading(false);
      return;
    }
    const fetchDetails = async () => {
      console.log(`[PrintDispatcher] Attempting to fetch data for ID: ${id}`);
      try {
        const data = await getSubmissionById(id);
        setSubmissionData(data);
      } catch (err: any) {
        console.error(`[PrintDispatcher] Error fetching submission ${id}:`, err);
        setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const renderPrintableForm = () => {
    if (!submissionData) return <div>No submission data to render.</div>;
    const { submission, blueprints } = submissionData;

    switch (submission.form_type) {

      case 'AS2':
        return <PrintableReportAS2 submission={submission} blueprints={blueprints} />;
      // --- ⬆️ สิ้นสุดการเปลี่ยนแปลง ---
      default:
        return <div>ไม่พบ Component สำหรับ Form Type: {submission.form_type}</div>;
    }
  };

  // --- ⬇️ นี่คือการเปลี่ยนแปลงที่สำคัญที่สุด ---

  if (error) {
    // ถ้า Error ให้แสดง Error
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (isLoading) {
    // (หัวใจของคอนเซปต์)
    // ถ้ากำลังโหลด... ให้แสดงหน้าว่างๆ (null)
    // นี่คือการป้องกันไม่ให้ Puppeteer ถ่ายติด <Loader /> ครับ
    return null;
  }

  // ถ้าโหลดเสร็จแล้ว และไม่ Error
  // ให้ Render เนื้อหาเลย โดย "ไม่มี" DefaultLayout หรือ Breadcrumb
  return <>{renderPrintableForm()}</>;
};

export default ReportPrintDispatcher;