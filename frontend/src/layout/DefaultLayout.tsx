// frontend/src/layout/DefaultLayout.tsx
import React, { useState, ReactNode } from 'react';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';
import { useLocation } from 'react-router-dom';

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isPrintMode = queryParams.get('print') === 'true';
  
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        {/* */}
        {!isPrintMode && <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
        {/* */}

        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* */}
          {!isPrintMode && <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
          {/* */}

          {/* */}
          <main>
            {/* ✨ ลบ Padding/Margin รอบนอกเมื่อ Print ✨ */}
            <div className={isPrintMode ? '' : 'mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10'}>
              {children}
            </div>
          </main>
          {/* */}
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;