
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSubmissionById } from '../../services/submissionService';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';


// -- Import Component แบบปกติ --
import ReportDetailBZ from './BZ/ReportDetailBZ';
import ReportDetailBZ3 from './BZ3/ReportDetailBZ3';
import ReportDetailBS3 from './BS3/ReportDetailBS3';

const ReportDetailDispatcher: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const renderFormDetail = () => { // ฟังก์ชันนี้จะเลือก Component ที่จะเรนเดอร์ตาม form_type 

    if (!submissionData) return <div>No submission data to render.</div>;

    const { submission, blueprints } = submissionData;

    switch (submission.form_type) {
      case 'BZ':
        return <ReportDetailBZ submission={submission} blueprints={blueprints} />;
      case 'BZ3':
        return <ReportDetailBZ3 submission={submission} blueprints={blueprints} />;
      case 'BS3':
        return <ReportDetailBS3 submission={submission} blueprints={blueprints} />;
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
      <div>
        {renderFormDetail()}
      </div>
    </>
  );
};

export default ReportDetailDispatcher;