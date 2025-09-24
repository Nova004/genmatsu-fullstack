import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById } from '../../services/submissionService';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

// -- Import Component แบบปกติ --
import ReportDetailBZ from './BZ/ReportDetailBZ';

const ReportDetailDispatcher: React.FC = () => {
  // --- จุดเช็คพอยท์ที่ 1 ---
  console.log('[Dispatcher] Component is rendering...');

  const { id } = useParams<{ id: string }>();
  // --- จุดเช็คพอยท์ที่ 2 ---
  console.log('[Dispatcher] ID from URL:', id);

  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // --- จุดเช็คพอยท์ที่ 3 ---
    console.log('[Dispatcher] useEffect is running...');

    if (!id) {
      console.error('[Dispatcher] Error: No ID found in URL.');
      setError("ไม่พบ ID ใน URL");
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      console.log(`[Dispatcher] Attempting to fetch data for ID: ${id}`);
      try {
        const data = await getSubmissionById(id);
        // --- จุดเช็คพอยท์ที่ 4 (ถ้าสำเร็จ) ---
        console.log('[Dispatcher] API call successful. Data received:', data);
        setSubmissionData(data);
      } catch (err) {
        // --- จุดเช็คพอยท์ที่ 5 (ถ้าล้มเหลว) ---
        console.error('[Dispatcher] API call failed.', err);
        setError(`ไม่สามารถดึงข้อมูลสำหรับ ID: ${id} ได้`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const renderFormDetail = () => {
    if (!submissionData) return <div>No submission data to render.</div>;
    
    const { submission, blueprints } = submissionData;
    // --- จุดเช็คพอยท์ที่ 6 ---
    console.log('[Dispatcher] Rendering form detail for type:', submission.form_type);
    
    switch (submission.form_type) {
      case 'BZ':
        return <ReportDetailBZ submission={submission} blueprints={blueprints} />;
      default:
        return <div>ไม่พบ Component สำหรับ Form Type: {submission.form_type}</div>;
    }
  };

  // --- จุดเช็คพอยท์ที่ 7 ---
  console.log(`[Dispatcher] Current state: isLoading=${isLoading}, error=${error}`);

  if (isLoading) {
    return <><div className="text-center p-4">กำลังโหลดรายละเอียด...</div></>;
  }
  if (error) {
    return <><div className="text-center p-4 text-red-500">{error}</div></>;
  }

  return (
    <>
      <Breadcrumb pageName={`รายละเอียดรายงาน Lot No: ${submissionData?.submission?.lot_no || ''}`} />
      <div>
        {renderFormDetail()}
      </div>
    </>
  );
};

export default ReportDetailDispatcher;