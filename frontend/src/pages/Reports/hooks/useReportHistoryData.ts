import { useState, useEffect } from 'react';
import { getAllSubmissions } from '../../../services/submissionService';
import { ironpowderService } from '../../../services/ironpowder.service'; // ✅ Import Recycle Service
import { socket } from '../../../services/socket';
import { SubmissionData } from '../components/types';

export const useReportHistoryData = (
  category: string = 'GEN_A',
  initialPagination = { pageIndex: 0, pageSize: 10 },
  initialFilters = {
    search: '',
    startDate: null,
    endDate: null,
    status: '',
    formType: '',
  },
) => {
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State (Managed inside hook or passed from component)
  // To allow re-fetching when params change, we need to accept them in fetchSubmissions

  const fetchSubmissions = async (
    pageIndex: number,
    pageSize: number,
    filters: any,
  ) => {
    setIsLoading(true);
    try {
      let data: any[] = [];
      let total = 0;

      // 1. Fetch data based on category
      if (category === 'Recycle') {
        const response = await ironpowderService.getAllIronpowder({
          page: pageIndex + 1,
          limit: pageSize,
          search: filters.search,
          startDate: filters.startDate?.startDate || null,
          endDate: filters.startDate?.endDate || null,
          status: filters.status,
          category: 'Recycle', // ✅ ส่ง category ตามที่ User ต้องการ
        });

        data = response.data;
        total = response.total;
      } else {
        // Standard Pagination Call
        const response = await getAllSubmissions(category, {
          page: pageIndex + 1, // API uses 1-based index
          pageSize: pageSize,
          search: filters.search,
          startDate: filters.startDate?.startDate || null, // Handle DateValueType
          endDate: filters.startDate?.endDate || null,
          status: filters.status,
          formType: filters.formType,
        });

        data = response.data;
        total = response.total;
      }

      // 2. Map to SubmissionData
      const formattedData: SubmissionData[] = data.map((item) => ({
        submission_id: item.id || item.submission_id || item.submissionId,
        lot_no: item.lot_no,
        submitted_at: item.created_at || item.submitted_at || item.report_date,
        status: item.status,
        form_type: item.form_type || item.machine_name || 'Recycle',
        production_date: item.production_date || item.report_date,
        pending_level: item.pending_level,
        submitted_by_name:
          item.submitted_by_name ||
          item.user?.username ||
          item.submitted_by ||
          'Unknown',
        submitted_by: item.submitted_by,
        category: item.category || category,
        // Added standard fields
        input_kg: item.input_kg || item.total_input, // ✅ Map Recycle fields
        output_kg: item.output_kg || item.total_output, // ✅ Map Recycle fields
        yield_percent: item.yield_percent,
        total_qty: item.total_qty,
      }));

      setSubmissions(formattedData);
      setTotalRows(total);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(`ไม่สามารถดึงข้อมูลประวัติการบันทึก (${category}) ได้`);
    } finally {
      setIsLoading(false);
    }
  };

  // Note: We don't auto-run useEffect here because the Component controls the state (react-table state).
  // The component should call fetchSubmissions when state changes.
  // OR we can keep it simple and just expose the fetch function.

  // Socket.io listener for real-time updates
  useEffect(() => {
    const handleServerAction = (data: any) => {
      console.log('⚡ Real-time update received:', data);
      if (data.action === 'refresh_data') {
        // Trigger a reload? We need current params to reload correctly.
        // This is tricky without state.
        // For now, let's just expose a forced reload trigger if needed.
      }
    };

    socket.on('server-action', handleServerAction);
    return () => {
      socket.off('server-action', handleServerAction);
    };
  }, []);

  return {
    submissions,
    setSubmissions,
    totalRows,
    isLoading,
    error,
    fetchSubmissions,
  };
};
