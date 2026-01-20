// hooks/fireToast.tsx
import toast from 'react-hot-toast';
import dataJSON from '../data.json';



// =================================================================
// ส่วนที่ 1: ฟังก์ชัน Helper สำหรับสร้าง UI ของ Toast (ปรับปรุงเล็กน้อย)
// =================================================================

// ใช้ 'success' | 'warning' | 'error' แทน number เพื่อให้โค้ดอ่านง่ายขึ้น
const createToastUI = (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => {
  // กำหนดสีพื้นหลังตาม type ที่ได้รับมา
  let bgColor = 'bg-[#04b20c]'; // success
  if (type === 'warning') bgColor = 'bg-[#eab90f]';
  if (type === 'error') bgColor = 'bg-[#e13f32]';

  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full ${bgColor} shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">{title}</p>
            <p className="mt-1 text-sm text-white">{msg}</p>
          </div>
        </div>
      </div>
      <div className="flex">
        <button
          onClick={() => toast.dismiss(t.id)}
          type="button"
          className="mr-2 box-content rounded-none border-none opacity-100 hover:no-underline hover:opacity-50 focus:opacity-50 focus:shadow-none focus:outline-none text-white"
          aria-label="Close"
        >
          <span className="w-[1em]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  ));
};


// =================================================================
// ส่วนที่ 2: ฟังก์ชันที่ Export ไปใช้งาน (แก้ไขตามที่คุยกัน)
// =================================================================

/**
 * [ฟังก์ชันใหม่] ใช้สำหรับยิง Toast แจ้งเตือนทั่วไป (เช่น Success, Error)
 * นี่คือฟังก์ชันที่หน้า NaClMaster และหน้าอื่นๆ จะเรียกใช้
 * @param type ประเภทของ Toast ('success', 'warning', 'error')
 * @param message ข้อความที่ต้องการแสดง
 * @param title หัวข้อ (ถ้าไม่ใส่ จะใช้ชื่อ type แทน)
 */
export const fireToast = (
  type: 'success' | 'warning' | 'error' | 'info',
  message: string,
  title?: string
) => {
  // ถ้าไม่มี title มาให้, ให้สร้าง title จาก type เช่น 'success' -> 'Success'
  const toastTitle = title || type.charAt(0).toUpperCase() + type.slice(1);
  createToastUI(toastTitle, message, type);
};


/**
 * [ฟังก์ชันเดิมของคุณ] เปลี่ยนชื่อให้สื่อความหมายมากขึ้น
 * ยังคงทำงานเหมือนเดิมทุกประการ คือยิงแจ้งเตือนจากเงื่อนไขใน LocalStorage
 */
export const fireAlertsFromSettings = () => {
  const alertSettings = localStorage.getItem("alertSettings");
  if (alertSettings) {
    for (const alertSetting of JSON.parse(alertSettings)) {
      console.log(alertSetting);

      const value = isNaN(parseFloat(alertSetting.value)) ? alertSetting.value : parseFloat(alertSetting.value);
      const para = alertSetting.criterion < 2 ? "delta_" + alertSetting.para : alertSetting.para;

      // แปลง type ที่เป็นตัวเลข (0,1,2) ให้เป็น string ('success', 'warning', 'error')
      const toastType: 'success' | 'warning' | 'error' = alertSetting.type === '0' ? 'success' : alertSetting.type === '1' ? 'warning' : 'error';

      if (alertSetting.id === "ALL") {
        Object.keys(dataJSON).map((id: string) => {
          const condition =
            alertSetting.criterion === '0' ? value <= -1 * (dataJSON as any)[id][para] :
            alertSetting.criterion === '1' || alertSetting.criterion === '3' ? value >= (dataJSON as any)[id][para] :
            alertSetting.criterion === '2' ? value <= (dataJSON as any)[id][para] :
            value === (dataJSON as any)[id][para];
          const realValue = alertSetting.criterion === '0' ? (dataJSON as any)[id][para] * -1 : (dataJSON as any)[id][para];

          if (condition) {
            const msg = `${alertSetting.para} of ${id} ${
              alertSetting.criterion == 0 ? "goes down by" :
              alertSetting.criterion == 1 ? "goes up by" :
              alertSetting.criterion == 2 ? "is smaller than" :
              alertSetting.criterion == 3 ? "is greater than" : "is equal to"
            } ${realValue}`;
            createToastUI(id, msg, toastType);
          }
        });
      } else {
        const id = alertSetting.id;

        const condition =
          alertSetting.criterion === '0' ? value >= -1 * (dataJSON as any)[id][para] :
          alertSetting.criterion === '1' || alertSetting.criterion === '3' ? value >= (dataJSON as any)[id][para] :
          alertSetting.criterion === '2' ? value <= (dataJSON as any)[id][para] :
          value === (dataJSON as any)[id][para];
        const realValue = alertSetting.criterion === '0' ? (dataJSON as any)[id][para] * -1 : (dataJSON as any)[id][para];

        if (condition) {
          const msg = `${alertSetting.para} of ${id} ${
            alertSetting.criterion == 0 ? "goes down by" :
            alertSetting.criterion == 1 ? "goes up by" :
            alertSetting.criterion == 2 ? "is smaller than" :
            alertSetting.criterion == 3 ? "is greater than" : "is equal to"
          } ${realValue}`;
          createToastUI(id, msg, toastType);
        }
      }
    }
  }
};

// **ไม่ต้องมี `export default` อีกต่อไป เพราะเราใช้ `export const` แทนแล้ว**