// frontend/src/components/Header/DropdownMessage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClickOutside from '../ClickOutside';
import { getMyMessages } from '../../services/submissionService';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../services/socket';

// รูป Default กรณีไม่มีรูปโปรไฟล์
import UserDefault from '../../images/user/user-01.png';

interface Message {
  submission_id: number;
  User_approver_id: string; // หรือ number ตาม DB
  commenter_name: string;
  action: string;
  comment: string;
  action_date: string;
  lot_no: string;
  category?: string; // ✅ เพิ่ม Field Category
}

const DropdownMessage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      try {
        const data = await getMyMessages(user.id);
        setMessages(data);
        setNotifying(data.length > 0);
      } catch (error) {
        console.error('Error loading messages', error);
      }
    };

    fetchMessages(); // โหลดครั้งแรก

    // ✅ Socket.io Listener: อัปเดตทันทีเมื่อมี Action (Approved/Rejected)
    const handleServerAction = (data: any) => {
      if (data.action === 'refresh_data') {
        console.log("💬 Message Refresh Triggered by Socket");
        fetchMessages();
      }
    };

    socket.on('server-action', handleServerAction);

    // ✅ Listener สำหรับ custom event เดิม (เผื่อยังมีใช้ที่อื่น)
    const handleRefresh = () => fetchMessages();
    window.addEventListener('REFRESH_NOTIFICATIONS', handleRefresh);

    return () => {
      socket.off('server-action', handleServerAction);
      window.removeEventListener('REFRESH_NOTIFICATIONS', handleRefresh);
    };
  }, [user]);

  // ฟังก์ชันช่วยเลือกไอคอนตามสถานะ Action
  const getActionIcon = (action: string) => {
    const lowerAction = action?.toLowerCase() || '';

    if (lowerAction.includes('approve')) {
      // ไอคอนติ๊กถูกสีเขียว (Approved)
      return (
        <div className="flex items-center gap-1 text-success bg-success/10 px-2 py-0.5 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[10px] font-medium">Approved</span>
        </div>
      );
    } else if (lowerAction.includes('reject')) {
      // ไอคอนกากบาทสีแดง (Rejected)
      return (
        <div className="flex items-center gap-1 text-danger bg-danger/10 px-2 py-0.5 rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[13px] font-medium">Rejected</span>
        </div>
      );
    }
    // Default กรณีอื่นๆ
    return (
      <span className="text-[15px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
        {action}
      </span>
    );
  };

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <li className="relative">
        <Link
          onClick={() => {
            setNotifying(false);
            setDropdownOpen(!dropdownOpen);
          }}
          className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
          to="#"
        >
          <span
            className={`absolute -top-0.5 -right-0.5 z-1 h-2 w-2 rounded-full bg-meta-1 ${notifying === false || messages.length === 0 ? 'hidden' : 'inline'
              }`}
          >
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
          </span>

          {/* New Icon: Chat Text Bubble */}
          <svg
            className="duration-300 ease-in-out"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </Link>

        {dropdownOpen && (
          <div className="absolute -right-16 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-96">
            <div className="px-4.5 py-3">
              <h5 className="text-sm font-medium text-bodydark2">
                Messages / Comments
              </h5>
            </div>

            <ul className="flex h-auto flex-col overflow-y-auto custom-scrollbar">
              {messages.length === 0 ? (
                <li className="px-4.5 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-10 h-10 mx-auto mb-2 opacity-40"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                    />
                  </svg>
                  ยังไม่มีข้อความหรือคอมเมนต์ใหม่
                </li>
              ) : (
                messages.map((msg, index) => {
                  // ✅ Logic การเลือกลิงก์ตาม Category
                  const isRecycle = msg.category === 'Recycle';
                  const linkTo = isRecycle
                    ? `/reports/edit/recycle/${msg.submission_id}`
                    : `/reports/edit/${msg.submission_id}`;

                  return (
                    <li key={index}>
                      <Link
                        className="flex gap-4 border-t border-stroke px-4.5 py-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4 transition-colors"
                        to={linkTo} // ใช้ Dynamic Link
                        onClick={() => setDropdownOpen(false)}
                      >
                        {/* ส่วนรูปโปรไฟล์ */}
                        <div className="h-11 w-11 min-w-11 rounded-full overflow-hidden border border-stroke dark:border-strokedark">
                          <img
                            src={`/genmatsu/api/auth/user/${msg.User_approver_id}/photo`}
                            onError={(e) => {
                              // เช็คก่อนว่ารูปปัจจุบันใช่ Default หรือยัง เพื่อกัน Loop
                              if (e.currentTarget.src !== UserDefault) {
                                e.currentTarget.src = UserDefault;
                              }
                            }}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* ส่วนเนื้อหา */}
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1.5">
                            <h6 className="text-sm font-semibold text-black dark:text-white truncate pr-2">
                              {msg.commenter_name || 'Unknown Approver'}
                            </h6>
                            {/* เรียกใช้ฟังก์ชันแสดงไอคอน */}
                            <div className="shrink-0">
                              {getActionIcon(msg.action)}
                            </div>
                          </div>

                          <p className="text-sm text-black/80 dark:text-white/80 line-clamp-2 mb-1.5 font-medium">
                            "{msg.comment}"
                          </p>

                          <div className="flex items-center text-xs text-body dark:text-bodydark">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-3 h-3 mr-1"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {new Date(msg.action_date).toLocaleDateString('en-US', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              timeZone: 'UTC'
                            })}{' '}
                            • Lot: {msg.lot_no}
                          </div>
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

export default DropdownMessage;