// src/components/Header/DropdownNotification.tsx

import { useState, useEffect } from 'react';
import ClickOutside from '../ClickOutside';
import { getMyPendingTasks } from '../../services/submissionService';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../services/socket';

// Helper for relative time (e.g., "2 hours ago")
const timeAgo = (dateInfo: string | Date) => {
  const date = new Date(dateInfo);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);

  const { user } = useAuth();
  const location = useLocation();
  const [notificationList, setNotificationList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    if (user.LV_Approvals === undefined || user.LV_Approvals === null) return;

    try {
      const myTasks = await getMyPendingTasks(user.LV_Approvals, user.id);
      setNotificationList(myTasks);
      setNotifying(myTasks.length > 0);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleServerAction = (data: any) => {
      if (data.action === 'refresh_data') {
        console.log("🔔 Notification Refresh Triggered by Socket");
        fetchNotifications();
      }
    };

    socket.on('server-action', handleServerAction);

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
          className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white transition-colors duration-200"
        >
          <span
            className={`absolute -top-0.5 -right-0.5 z-1 h-2 w-2 rounded-full bg-meta-1 ${!notifying || notificationList.length === 0 ? 'hidden' : 'inline'
              }`}
          >
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
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
            className={`absolute -right-27 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80 z-99999`}
          >
            <div className="px-4.5 py-3 border-b border-stroke dark:border-strokedark flex items-center justify-between">
              <h5 className="text-sm font-medium text-bodydark2 dark:text-gray-300">
                Notifications
              </h5>
              {notificationList.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                  {notificationList.length} New
                </span>
              )}
            </div>

            <ul className="flex h-auto flex-col overflow-y-auto no-scrollbar">
              {loading ? (
                <li className="px-4.5 py-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </li>
              ) : notificationList.length === 0 ? (
                <li className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="bg-gray-50 dark:bg-meta-4 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium dark:text-gray-400">No new notifications</p>
                  <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                </li>
              ) : (
                notificationList.map((item, index) => {
                  const isRejected = item.status === 'Rejected';
                  const isRecycle = item.category === 'Recycle' || item.form_type === 'Recycle' || item.machine_name;

                  let linkPath = isRecycle
                    ? `/reports/view/recycle/${item.submission_id}`
                    : `/reports/view/${item.submission_id}`;

                  if (isRejected) {
                    linkPath = isRecycle
                      ? `/reports/edit/recycle/${item.submission_id}`
                      : `/reports/edit/${item.submission_id}`;
                  }

                  const timeDisplay = item.created_at || item.submitted_at ? timeAgo(item.created_at || item.submitted_at) : '';

                  return (
                    <li key={index}>
                      <Link
                        className={`group flex items-start gap-4 border-b border-stroke px-4.5 py-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4 transition-all duration-200 ${isRejected ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                        to={linkPath}
                        onClick={() => setDropdownOpen(false)}
                      >
                        {/* Icon Container */}
                        <div className={`
                          h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center border
                          ${isRejected
                            ? 'bg-red-100 text-red-500 border-red-200 dark:bg-red-900/30 dark:border-red-800'
                            : 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800'}
                        `}>
                          {isRejected ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-0.5 w-full">
                          <div className="flex justify-between items-start">
                            <span className={`text-sm font-semibold ${isRejected ? 'text-red-600 dark:text-red-400' : 'text-black dark:text-white'}`}>
                              {isRejected ? 'Request Rejected' : 'Approval Request'}
                            </span>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                              {timeDisplay}
                            </span>
                          </div>

                          <p className="text-sm text-black dark:text-white font-medium">
                            Lot: {item.lot_no}
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {item.form_type || (isRecycle ? 'Recycle' : 'General')} • by {item.submitted_by_name || item.submitted_by || 'Unknown'}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </li>
    </ClickOutside>
  );
};

export default DropdownNotification;