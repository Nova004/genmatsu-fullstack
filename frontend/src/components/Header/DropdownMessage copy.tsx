// frontend/src/components/Header/DropdownMessage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClickOutside from '../ClickOutside';
import { getMyMessages } from '../../services/submissionService'; // import service ใหม่
import { useAuth } from '../../context/AuthContext';

// รูป Default กรณีไม่มีรูปโปรไฟล์
import UserDefault from '../../images/user/user-01.png';

const DropdownMessage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [messages, setMessages] = useState<any[]>([]); // state เก็บข้อความจริง

  const { user } = useAuth();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      try {
        // ดึงคอมเมนต์ของฉัน
        const data = await getMyMessages(user.id);
        setMessages(data);
        setNotifying(data.length > 0);
      } catch (error) {
        console.error("Error loading messages", error);
      }
    };

    fetchMessages();
    // ตั้งเวลาเช็คข้อความใหม่ทุก 1 นาที
    const interval = setInterval(fetchMessages, 60000);
    return () => clearInterval(interval);
  }, [user]);

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

          <svg
            className="fill-current duration-300 ease-in-out"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.0002 0.750195C9.4127 0.750195 9.7502 1.0877 9.7502 1.5002V3.06582C9.77832 3.06582 9.80645 3.06582 9.83457 3.09395C14.7752 3.53457 16.9689 7.02207 17.0814 11.6346C17.1096 11.9721 16.8283 12.2533 16.4908 12.2533H15.7502V15.0002C15.7502 15.4127 15.4127 15.7502 15.0002 15.7502H3.0002C2.5877 15.7502 2.2502 15.4127 2.2502 15.0002V12.2533H1.50957C1.17207 12.2533 0.89082 11.9721 0.918945 11.6346C1.03145 7.0502 3.2252 3.53457 8.16582 3.09395C8.19395 3.06582 8.22207 3.06582 8.2502 3.06582V1.5002C8.2502 1.0877 8.5877 0.750195 9.0002 0.750195ZM3.7502 12.2533H14.2502V14.2502H3.7502V12.2533ZM9.0002 4.60332C5.4002 4.96895 3.79707 7.6127 3.7502 10.7533H14.2502C14.2033 7.6127 12.6002 4.96895 9.0002 4.60332Z"
              fill=""
            />
          </svg>
        </Link>

        {dropdownOpen && (
          <div className="absolute -right-16 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80">
            <div className="px-4.5 py-3">
              <h5 className="text-sm font-medium text-bodydark2">Messages</h5>
            </div>

            <ul className="flex h-auto flex-col overflow-y-auto">
              {messages.length === 0 ? (
                <li className="px-4.5 py-3 text-center text-sm text-gray-500">
                  ไม่มีข้อความใหม่
                </li>
              ) : (
                messages.map((msg, index) => (
                  <li key={index}>
                    <Link
                      className="flex gap-4.5 border-t border-stroke px-4.5 py-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4"
                      to={`/reports/view/${msg.submission_id}`} // ลิงก์ไปดูงาน
                    >
                      <div className="h-12.5 w-12.5 rounded-full overflow-hidden border border-slate-200">
                        {/* ถ้ามีรูปใช้รูป ถ้าไม่มีใช้รูป Default */}
                        <img
                          // ✅ ใช้ URL API ตามที่คุณต้องการ
                          src={`/genmatsu/api/auth/user/${msg.User_approver_id}/photo`}

                          // ✅ ถ้าโหลดไม่ได้ (เช่น ไม่มีรูป หรือ API พัง) ให้ใช้รูป Default แทน
                          onError={(e) => {
                            e.currentTarget.src = UserDefault;
                          }}

                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="w-full">
                        <h6 className="text-sm font-medium text-black dark:text-white flex justify-between">
                          {msg.commenter_name || 'Unknown'}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${msg.action === 'Approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                              }`}
                          >
                            {msg.action}
                          </span>
                        </h6>
                        <p className="text-sm truncate w-40 text-black/70 dark:text-white/70">
                          {msg.comment}
                        </p>
                        <p className="text-xs text-body">
                          {new Date(msg.action_date).toLocaleDateString('th-TH')} • Lot: {msg.lot_no}
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

export default DropdownMessage;