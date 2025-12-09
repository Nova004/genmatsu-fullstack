import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClickOutside from '../ClickOutside';
import UserOne from '../../images/user/user-01.png'; // รูป Default
import { useAuth } from '../../context/AuthContext';

const DropdownUser = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ✅ ไม่ต้องมี useEffect หรือ axios เพื่อดึงรูปแล้ว
  // ✅ ใช้ URL ตรงๆ ใน tag <img> ด้านล่างได้เลย

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-4"
        to="#"
      >
        <span className="hidden text-right lg:block">
          <span className="block text-sm font-medium text-black dark:text-white">
            {/* แสดงชื่อ User */}
            {user?.nameEN || user?.username || 'User'}
          </span>
          <span className="block text-xs">
            {/* แสดงตำแหน่ง (ถ้ามี) หรือ Default */}
            {user ? `ID: ${user.id}` : ''}
          </span>
        </span>

        <span className="h-12 w-12 rounded-full overflow-hidden border border-stroke dark:border-strokedark">
          {/* ✅ จุดที่แก้ไข: ใช้ URL ยิงไปที่ API โดยตรง */}
          <img
            src={user?.id ? `/genmatsu/api/auth/user/${user.id}/photo` : UserOne}
            onError={(e) => {
              // ถ้าโหลดไม่ได้ (ไม่มีรูป) ให้ใช้รูป Default
              e.currentTarget.src = UserOne;
            }}
            alt="User"
            className="w-full h-full object-cover"
          />
        </span>

        <svg
          className={`hidden fill-current sm:block ${dropdownOpen ? 'rotate-180' : ''
            }`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z"
            fill=""
          />
        </svg>
      </Link>

      {/* Dropdown Start */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <ul className="flex flex-col gap-5 border-b border-stroke px-6 py-7.5 dark:border-strokedark">
            <li>
              <Link
                to="/profile"
                className="flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
              >
                <svg className="fill-current" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.75 4.58334C13.75 6.09587 12.5208 7.33334 11 7.33334C9.47917 7.33334 8.25 6.09587 8.25 4.58334C8.25 3.07081 9.47917 1.83334 11 1.83334C12.5208 1.83334 13.75 3.07081 13.75 4.58334Z" fill="" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M11 9.16667C6.73333 9.16667 3.66667 11.5167 3.66667 16.5C3.66667 17.5 4.5 18.3333 5.5 18.3333H16.5C17.5 18.3333 18.3333 17.5 18.3333 16.5C18.3333 11.5167 15.2667 9.16667 11 9.16667ZM11 11C14.15 11 16.5 12.95 16.5 16.5H5.5C5.5 12.95 7.85 11 11 11Z" fill="" />
                </svg>
                My Profile
              </Link>
            </li>
          </ul>
          <button
            className="flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
            onClick={logout}
          >
            <svg className="fill-current" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.5375 0.618744H11.6531C10.7594 0.618744 10.0031 1.37499 10.0031 2.26874V4.64062C10.0031 5.05312 10.3469 5.39687 10.7594 5.39687C11.1719 5.39687 11.55 5.05312 11.55 4.64062V2.23437C11.55 2.16562 11.5844 2.13124 11.6531 2.13124H15.5375C16.3625 2.13124 17.0156 2.78437 17.0156 3.60937V18.3562C17.0156 19.1812 16.3625 19.8344 15.5375 19.8344H11.6531C11.5844 19.8344 11.55 19.5062 11.55 17.0312V14.625C11.55 14.2125 11.1719 13.8687 10.7594 13.8687C10.3469 13.8687 10.0031 14.2125 10.0031 14.625V17.0312C10.0031 17.925 10.7594 18.6812 11.6531 18.6812H15.5375C16.8437 18.6812 17.9094 17.6156 17.9094 16.3094V5.98124C17.9094 4.67499 16.8437 3.60937 15.5375 3.60937V0.618744Z" fill="" />
              <path d="M5.46562 6.80624C5.12187 6.46249 4.57187 6.46249 4.22812 6.80624L0.278124 10.7562C-0.0656256 11.0999 -0.0656256 11.65 0.278124 11.9937L4.22812 15.9437C4.57187 16.2875 5.12187 16.2875 5.46562 15.9437C5.80937 15.5999 5.80937 15.0499 5.46562 14.7062L2.99062 12.2344H10.3125C10.7937 12.2344 11.2062 11.8219 11.2062 11.3406C11.2062 10.8594 10.7937 10.4469 10.3125 10.4469H2.99062L5.46562 7.97499C5.80937 7.63124 5.80937 7.08124 5.46562 6.80624Z" fill="" />
            </svg>
            Log Out
          </button>
        </div>
      )}
      {/* Dropdown End */}
    </ClickOutside>
  );
};

export default DropdownUser;