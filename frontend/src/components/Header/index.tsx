// frontend/src/components/Header/index.tsx


import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DropdownMessage from './DropdownMessage';
import DropdownNotification from './DropdownNotification';
import DropdownUser from './DropdownUser';
import LogoIcon from '../../images/logo/logo-icon.svg';
import DarkModeSwitcher from './DarkModeSwitcher';

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  const navigate = useNavigate();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchScope, setSearchScope] = useState('gen-b');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const targetPath = searchScope === 'gen-a'
        ? '/reports/history/gen-a'
        : '/reports/history/gen-b';

      navigate(`${targetPath}?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white/90 backdrop-blur-sm border-b border-stroke shadow-sm dark:bg-boxdark/90 dark:border-strokedark dark:shadow-none transition-all duration-300">
      <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-11">

        {/* --- Left Side: Hamburger & Logo (Mobile) --- */}
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && '!w-full delay-300'}`} ></span>
                <span className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && 'delay-400 !w-full'}`} ></span>
                <span className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && '!w-full delay-500'}`} ></span>
              </span>
              <span className="absolute right-0 h-full w-full rotate-45">
                <span className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && '!h-0 !delay-[0]'}`} ></span>
                <span className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white ${!props.sidebarOpen && '!h-0 !delay-200'}`} ></span>
              </span>
            </span>
          </button>
          <Link className="block flex-shrink-0 lg:hidden" to="/">
            <img src={LogoIcon} alt="Logo" />
          </Link>
        </div>

        {/* --- Center: Global Search Bar --- */}
        <div className="hidden sm:block">
          <form
            onSubmit={handleSearch}
            className="relative flex items-center w-full xl:w-125 bg-gray-100/50 hover:bg-gray-100 dark:bg-meta-4/50 dark:hover:bg-meta-4 rounded-lg border border-transparent focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300"
          >

            {/* 1. Scope Selector (Dropdown) */}
            <div className="relative border-r border-gray-300 dark:border-gray-600 pl-1 shrink-0">
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
                className="appearance-none bg-transparent py-2.5 pl-3 pr-8 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 focus:outline-none cursor-pointer hover:text-primary transition-colors"
              >
                <option value="gen-b">GEN B</option>
                <option value="gen-a">GEN A</option>
              </select>
              {/* Custom Chevron Down */}
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-70">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* 2. Input Field (ขยายเต็มพื้นที่) */}
            <input
              type="text"
              placeholder="Search Lot No, ID..."
              value={searchTerm}
              // ห้ามใส่ maxLength={6} ตรงนี้นะครับ เดี๋ยวตอนก็อปวางมันจะตัดก่อนแก้
              onChange={(e) => {
                const cleanValue = e.target.value
                  .replace(/[^a-zA-Z0-9]/g, '') // 1. ลบอักษรแปลกปลอม/ช่องว่าง/ภาษาไทย
                  .toUpperCase();               // 2. แปลงเป็นตัวพิมพ์ใหญ่

                setSearchTerm(cleanValue.slice(0, 6)); // 3. ตัดให้เหลือ 6 ตัว
              }}
              className="w-full bg-transparent pl-3 pr-12 py-2.5 text-sm font-medium text-black placeholder:text-gray-500 focus:outline-none dark:text-white"
            />

            {/* 3. Search Button (ย้ายมาขวา + เป็นปุ่มกดได้) */}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
              title="Click to Search"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z" fill="currentColor" />
              </svg>
            </button>

          </form>
        </div>
        {/* --- Right Side: Actions & Profile --- */}
        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <DropdownNotification />
            {/* --- <DropdownMessage />--- */}
          </ul>

          <div className="h-6 w-[1px] bg-gray-300 dark:bg-strokedark hidden sm:block"></div>

          <DropdownUser />
        </div>
      </div>
    </header>
  );
};

export default Header;