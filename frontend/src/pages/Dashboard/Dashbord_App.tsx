
// location: src/pages/Dashboard/Dashbord_App.tsx

import Link from 'react-router-dom'; // Note: check if Link is used, if not remove. But keeping existing imports safe.
import MenuCard from '../../components/MenuCard';
import { FaFileAlt, FaChartLine, FaCogs, FaUserMd, FaHandPaper } from 'react-icons/fa';
import { useAuth } from "../../context/AuthContext";

const ECommerce: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8">

      {/* ================= SECTION 1: Production Reports ================= */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-black dark:text-white">
          📑 History & Reports
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">

          {/* --- Card 1: GEN-A --- */}
          <MenuCard
            title="เอกสารการผลิต GEN-A"
            description="เข้าสู่หน้าบันทึกฟอร์ม GEN-A"
            linkTo="/reports/history/gen-a"
          >
            <FaFileAlt size={22} className="text-blue-600 dark:text-blue-400" />
          </MenuCard>

          {/* --- Card 2: GEN-B --- */}
          <MenuCard
            title="เอกสารการผลิต GEN-B"
            description="เข้าสู่หน้าบันทึกฟอร์ม GEN-B"
            linkTo="/reports/history/gen-b"
          >
            <FaFileAlt size={22} className="text-green-600 dark:text-green-400" />
          </MenuCard>


          {/* --- Card 3: Report Production Amount --- */}
          <MenuCard
            title="Report Production Amount"
            description="บันทึกการผลิตประจำวัน"
            linkTo="/reports/daily-production"
          >
            <FaChartLine size={22} className="text-indigo-600 dark:text-indigo-400" />
          </MenuCard>
        </div>
      </div>

      <div>
        <div className="border-t border-gray-200 my-6"></div> {/* เส้นคั่นบางๆ */}
        <h2 className="mb-4 text-xl font-bold text-black dark:text-white flex items-center gap-2">
          🛡️ Hygiene & Safety Control
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">

          {/* --- Card 4: Personal hygiene control record --- */}
          <MenuCard
            title="Personal hygiene control record"
            description="บันทึกการควบคุมสุขอนามัยประจำพื้นที่ Genmatsu"
            linkTo="/reports/hygiene-control" // Link สมมติ
          >
            <FaUserMd size={22} className="text-teal-600 dark:text-teal-400" />
          </MenuCard>

          {/* --- Card 5: Glove Check Sheet --- */}
          <MenuCard
            title="Glove check sheet control"
            description="บันทึกการตรวจสอบถุงมือประจำพื้นที่ Genmatsu"
            linkTo="/reports/glove-check"
          >
            <FaHandPaper size={22} className="text-orange-500 dark:text-orange-400" />
          </MenuCard>
        </div>
      </div>

      {/* ================= SECTION 2: System Administration ================= */}
      {((user?.LV_Approvals ?? 0) >= 2) && (
        <div>
          <div className="border-t border-gray-200 my-6"></div> {/* เส้นคั่นบางๆ */}
          <h2 className="mb-4 text-xl font-bold text-black dark:text-white flex items-center gap-2">
            ⚙️ System Administration & Master Data
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
            {/* --- Card 4: Master (Admin) --- */}
            <MenuCard
              title="Master (Admin)"
              description="จัดการข้อมูลหลังบ้านสำหรับแอดมิน"
              linkTo="/master/Dashbord_Master"
            >
              <FaCogs size={22} className="text-rose-500 dark:text-rose-400" />
            </MenuCard>
          </div>
        </div>
      )}

    </div>
  );
};

export default ECommerce;