import { useState, useEffect } from 'react';
import ClickOutside from '../ClickOutside';
import { getMyPendingTasks } from '../../services/submissionService';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../services/socket';


const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const { user } = useAuth();
  const location = useLocation(); // ใช้ Hook นี้เพื่อจับการเปลี่ยนหน้า
  const [notificationList, setNotificationList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      // ถ้า User ไม่มี Level หรือไม่ใช่ผู้อนุมัติ ก็ไม่ต้องยิง API เลย
      if (user.LV_Approvals === undefined || user.LV_Approvals === null) return;

      try {
        const myTasks = await getMyPendingTasks(user.LV_Approvals);
        setNotificationList(myTasks);
        setNotifying(myTasks.length > 0);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      } finally {
        setLoading(false);
      }
    };

    // 1. เรียกทันทีเมื่อโหลด หรือเปลี่ยนหน้า
    fetchNotifications();

    // ✅ Socket.io Listener: อัปเดตทันทีเมื่อมี Action (Create, Update, Delete, Approve, etc.)
    const handleServerAction = (data: any) => {
      if (data.action === 'refresh_data') {
        console.log("🔔 Notification Refresh Triggered by Socket");
        fetchNotifications();
      }
    };

    socket.on('server-action', handleServerAction);

    // Cleanup
    return () => {
      socket.off('server-action', handleServerAction);
    };

  }, [user, location]);

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <li>
        <Link
          onClick={() => {
            setNotifying(false);
            setDropdownOpen(!dropdownOpen);
          }}
          to="#"
          className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
        >
          {/* --- จุดแดงแจ้งเตือน (Pulse Effect) --- */}
          <span
            className={`absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-danger ${notificationList.length === 0 ? 'hidden' : 'inline'
              }`}
          >
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
          </span>

          <svg
            className="fill-current duration-300 ease-in-out"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.1999 14.9343L15.6374 14.0624C15.5249 13.8937 15.4687 13.7249 15.4687 13.528V7.67803C15.4687 6.01865 14.7655 4.47178 13.4718 3.31865C12.4312 2.39053 11.0812 1.7999 9.64678 1.6874V1.1249C9.64678 0.787402 9.36553 0.478027 8.9999 0.478027C8.6624 0.478027 8.35303 0.759277 8.35303 1.1249V1.65928C8.29678 1.65928 8.24053 1.65928 8.18428 1.6874C4.92178 2.05303 2.4749 4.66865 2.4749 7.79053V13.528C2.44678 13.8093 2.39053 13.9499 2.33428 14.0343L1.7999 14.9343C1.63115 15.2155 1.63115 15.553 1.7999 15.8343C1.96865 16.0874 2.2499 16.2562 2.55928 16.2562H8.38115V16.8749C8.38115 17.2124 8.6624 17.5218 9.02803 17.5218C9.36553 17.5218 9.6749 17.2405 9.6749 16.8749V16.2562H15.4687C15.778 16.2562 16.0593 16.0874 16.228 15.8343C16.3968 15.553 16.3968 15.2155 16.1999 14.9343ZM3.23428 14.9905L3.43115 14.653C3.5999 14.3718 3.68428 14.0343 3.74053 13.6405V7.79053C3.74053 5.31553 5.70928 3.23428 8.3249 2.95303C9.92803 2.78428 11.503 3.2624 12.6562 4.2749C13.6687 5.1749 14.2312 6.38428 14.2312 7.67803V13.528C14.2312 13.9499 14.3437 14.3437 14.5968 14.7374L14.7655 14.9905H3.23428Z"
              fill=""
            />
          </svg>
        </Link>

        {dropdownOpen && (
          <div
            className={`absolute -right-27 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80`}
          >
            <div className="px-4.5 py-3 bg-gray-50 dark:bg-meta-4 border-b border-stroke dark:border-strokedark">
              <h5 className="text-sm font-semibold text-bodydark2 flex justify-between items-center">
                งานรออนุมัติ
                {notificationList.length > 0 && (
                  <span className="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {notificationList.length}
                  </span>
                )}
              </h5>
            </div>

            <ul className="flex h-auto flex-col overflow-y-auto">
              {loading ? (
                <li className="px-4.5 py-3 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </li>
              ) : notificationList.length === 0 ? (
                <li className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <div className="bg-gray-100 dark:bg-meta-4 p-3 rounded-full mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <p className="text-sm font-medium text-black dark:text-white">ไม่มีงานค้าง</p>
                  <p className="text-xs text-body">คุณอนุมัติครบทุกงานแล้ว</p>
                </li>
              ) : (
                notificationList.map((item, index) => (
                  <li key={index}>
                    <Link
                      className="flex gap-4 border-t border-stroke px-4.5 py-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4 transition-colors duration-200"
                      to={`/reports/view/${item.submission_id}`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>

                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-black dark:text-white truncate w-32">
                            Lot: {item.lot_no}
                          </p>
                          <span className="text-[10px] text-body">
                            {new Date(item.created_at || item.submitted_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-body truncate">
                          รออนุมัติ • โดย {item.submitted_by_name || item.submitted_by || 'User'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </li>
    </ClickOutside>
  );
};

export default DropdownNotification;