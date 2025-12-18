import React, { useState } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import CoverOne from '../images/cover/cover-01.png';
import userSix from '../images/user/user-06.png';
import { useAuth } from "../context/AuthContext";
import { fireToast } from '../hooks/fireToast'; // อย่าลืม import fireToast

const Profile = () => {
  const { user } = useAuth();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [coverImage] = useState<string>(CoverOne);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewImage(URL.createObjectURL(file));
      // TODO: Upload API Logic
    }
  };

  // ✨ ฟังก์ชัน Copy ID (ลูกเล่นแบบ Pro)
  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      fireToast("success", "คัดลอก User ID เรียบร้อยแล้ว");
    }
  };

  return (
    <>
      <Breadcrumb pageName="My Profile" />

      {/* เพิ่ม animate-fade-in เพื่อความนุ่มนวลตอนโหลดหน้า */}
      <div className="overflow-hidden rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark animate-fade-in">

        {/* --- 1. Cover Section --- */}
        <div className="relative z-20 h-48 md:h-64 bg-gray-200">
          <img
            src={coverImage}
            alt="profile cover"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
        </div>

        {/* --- 2. Main Profile Content --- */}
        <div className="px-4 pb-6 lg:pb-8 xl:pb-12">

          {/* Avatar Area */}
          <div className="relative -mt-20 mb-6 flex flex-col items-center">
            <div className="relative z-30 mx-auto h-32 w-32 rounded-full bg-white/20 p-1 backdrop-blur sm:h-40 sm:w-40 sm:p-1.5">
              <div className="relative h-full w-full rounded-full ring-4 ring-white dark:ring-boxdark shadow-lg">
                <img
                  src={
                    previewImage
                      ? previewImage
                      : user?.id
                        ? `/genmatsu/api/auth/user/${user.id}/photo`
                        : userSix
                  }
                  onError={(e) => {
                    if (e.currentTarget.src !== userSix) {
                      e.currentTarget.src = userSix;
                    }
                  }}
                  alt="profile"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            </div>

            {/* Name & Position */}
            <div className="mt-4 text-center">
              <h3 className="mb-1 text-2xl font-bold text-black dark:text-white sm:text-3xl">
                {user?.username || "Guest User"}
              </h3>
              <p className="font-medium text-body dark:text-gray-400 bg-gray-100 dark:bg-meta-4 inline-block px-3 py-1 rounded-full text-sm">
                {user?.position || "System User"}
              </p>
            </div>
          </div>

          {/* --- 3. Stats Cards --- */}
          <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">

            {/* Card 1: ID (✨ Click to Copy) */}
            <div
              onClick={handleCopyId}
              className="group relative cursor-pointer flex flex-col items-center justify-center rounded-xl border border-stroke bg-gray-50 py-4 px-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-strokedark dark:bg-meta-4 h-full"
              title="Click to copy ID"
            >
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-bold text-black dark:text-white mb-1">
                  {user?.id || "-"}
                </h4>
                {/* Copy Icon (แสดงเมื่อ Hover) */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500 group-hover:text-primary transition-colors">User ID</span>
            </div>

            {/* Card 2: Approval Level (✨ Hover Lift) */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 py-4 px-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:bg-primary/10 h-full">
              <h4 className="text-xl font-bold text-primary mb-1">
                LV. {user?.LV_Approvals || "0"}
              </h4>
              <span className="text-sm font-medium text-primary">Approval Level</span>
            </div>

            {/* Card 3: Access Rights (✨ Hover Lift) */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-stroke bg-gray-50 py-4 px-2 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-strokedark dark:bg-meta-4 h-full">

              {/* Badges Container */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                {/* 1. Request Badge */}
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                  </svg>
                  Request (A, B)
                </span>

                {/* 2. Approver Badge */}
                {(user?.LV_Approvals ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    Approver
                  </span>
                )}

                {/* 3. Master Admin Badge */}
                {(user?.LV_Approvals ?? 0) >= 2 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-900/20 dark:text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M10.362 1.093a.75.75 0 00-.724 0L2.529 5.018a.75.75 0 00-.468.693v5.333a7.518 7.518 0 002.933 6.035l4.312 2.738a.75.75 0 00.788 0l4.312-2.738a7.518 7.518 0 002.933-6.035V5.71a.75.75 0 00-.468-.693l-7.109-3.925zM10 2.438l6.391 3.529v5.077c0 2.229-1.328 4.256-3.376 5.166L10 17.568l-3.015-1.358C4.969 15.299 3.64 13.273 3.64 11.044V5.967L10 2.438z" clipRule="evenodd" />
                      <path d="M9.664 6.812a.75.75 0 01.672 0l2.5 1.25a.75.75 0 010 1.34l-2.5 1.25a.75.75 0 01-.672 0l-2.5-1.25a.75.75 0 010-1.34l2.5-1.25z" />
                    </svg>
                    Master Admin
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-500">Access Capabilities</span>
            </div>
          </div>

          {/* --- 4. Detailed Info Section --- */}
          <div className="mx-auto mt-10 max-w-4xl border-t border-stroke pt-8 dark:border-strokedark">
            <h4 className="mb-6 text-lg font-semibold text-black dark:text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h4>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-10">

              {/* Email / GEN No Block */}
              <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-meta-4 text-primary shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">GEN No.</span>
                  <span className="block text-black dark:text-white font-medium text-sm sm:text-base break-all">
                    {user?.Gen_Manu_mem_No || "-"}
                  </span>
                </div>
              </div>

              {/* Department Block */}
              <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-meta-4 text-primary shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">Department</span>
                  <span className="block text-black dark:text-white font-medium text-sm sm:text-base">
                    {user?.section || "Production"}
                  </span>
                </div>
              </div>

              {/* Shift Block */}
              <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-meta-4 text-primary shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">Work Shift</span>
                  <span className="block text-black dark:text-white font-medium text-sm sm:text-base">
                    {user?.shift || "Day Shift"}
                  </span>
                </div>
              </div>

              {/* Status Block (✨ Logic เช็คสีสถานะ) */}
              <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors">
                {/* เปลี่ยนสี BG Icon ตามสถานะ */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ${user?.statusJob === 'Working' ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">Status</span>
                  {/* เปลี่ยนสี Badge ตามสถานะ */}
                  <span className={`inline-flex items-center rounded-full py-1 px-3 text-sm font-medium ${user?.statusJob === 'Working'
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                    }`}>
                    <span className={`mr-1.5 h-2 w-2 rounded-full ${user?.statusJob === 'Working' ? 'bg-success' : 'bg-danger'}`}></span>
                    {user?.statusJob || "Inactive"}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Profile;