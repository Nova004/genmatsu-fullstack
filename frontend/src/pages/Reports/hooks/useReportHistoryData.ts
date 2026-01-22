import { useState, useEffect } from 'react';
import { getAllSubmissions } from '../../../services/submissionService';
import { ironpowderService } from '../../../services/ironpowder.service'; // ✅ Import Recycle Service
import { socket } from '../../../services/socket';
import { SubmissionData } from '../components/types';

export const useReportHistoryData = (category: string = 'GEN_A') => {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      let response: any[] = [];

      // 1. Fetch data based on category
      if (category === 'Recycle') {
        response = await ironpowderService.getAllIronpowder();
      } else {
        response = await getAllSubmissions(category);
      }

      // 2. Map to SubmissionData
      const formattedData: SubmissionData[] = response.map((item) => ({
        submission_id: item.id || item.submission_id || item.submissionId, // ✅ Support submissionId
        lot_no: item.lot_no,
        submitted_at: item.created_at || item.submitted_at || item.report_date, // ✅ Support report_date
        status: item.status,
        form_type: item.form_type || item.machine_name || 'Recycle', // ✅ Support machine_name
        production_date: item.production_date || item.report_date, // ✅ Support report_date as production_date
        pending_level: item.pending_level,
        submitted_by_name:
          item.submitted_by_name ||
          item.user?.username ||
          item.submitted_by ||
          'Unknown', // ✅ Prioritize submitted_by_name
        submitted_by: item.submitted_by, // ✅ Keep submitted_by ID if needed
        category: item.category || category,
      }));

      setSubmissions(formattedData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(`ไม่สามารถดึงข้อมูลประวัติการบันทึก (${category}) ได้`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [category]);

  // Socket.io listener for real-time updates
  useEffect(() => {
    const handleServerAction = (data: any) => {
      console.log('⚡ Real-time update received:', data);

      if (data.action === 'refresh_data') {
        if (data.deletedId) {
          setSubmissions((prev) =>
            prev.filter(
              (item) => item.submission_id !== parseInt(data.deletedId),
            ),
          );
        } else {
          fetchSubmissions();
        }
      }
    };

    socket.on('server-action', handleServerAction);

    return () => {
      socket.off('server-action', handleServerAction);
    };
  }, []); // Run once on mount

  return {
    submissions,
    setSubmissions,
    isLoading,
    error,
    fetchSubmissions,
  };
};
