// hooks/fireToast.tsx
import toast from 'react-hot-toast';
import dataJSON from '../data.json';

// Define styles and icons for each toast type
const TOAST_VARIANTS = {
  success: {
    icon: (
      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    ),
    bgColor: 'bg-white dark:bg-boxdark',
    borderColor: 'border-l-4 border-green-500',
    titleColor: 'text-green-800 dark:text-green-400',
    textColor: 'text-gray-600 dark:text-gray-300'
  },
  warning: {
    icon: (
      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
    ),
    bgColor: 'bg-white dark:bg-boxdark',
    borderColor: 'border-l-4 border-yellow-500',
    titleColor: 'text-yellow-800 dark:text-yellow-400',
    textColor: 'text-gray-600 dark:text-gray-300'
  },
  error: {
    icon: (
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    ),
    bgColor: 'bg-white dark:bg-boxdark',
    borderColor: 'border-l-4 border-red-500',
    titleColor: 'text-red-800 dark:text-red-400',
    textColor: 'text-gray-600 dark:text-gray-300'
  },
  info: {
    icon: (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    ),
    bgColor: 'bg-white dark:bg-boxdark',
    borderColor: 'border-l-4 border-blue-500',
    titleColor: 'text-blue-800 dark:text-blue-400',
    textColor: 'text-gray-600 dark:text-gray-300'
  }
};


// =================================================================
// ส่วนที่ 1: ฟังก์ชัน Helper สำหรับสร้าง UI ของ Toast (Design ใหม่: สะอาดตา & Modern)
// =================================================================

const createToastUI = (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => {
  const variant = TOAST_VARIANTS[type] || TOAST_VARIANTS.info;

  toast.custom((t) => (
    <div
      className={`${t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-sm w-full ${variant.bgColor} shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden ${variant.borderColor}`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {variant.icon}
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-semibold ${variant.titleColor}`}>{title}</p>
            <p className={`mt-1 text-sm ${variant.textColor}`}>{msg}</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toast.dismiss(t.id)}
          type="button"
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  ));
};


// =================================================================
// ส่วนที่ 2: ฟังก์ชันที่ Export ไปใช้งาน
// =================================================================

/**
 * [Function] ยิง Toast แจ้งเตือนทั่วไป (Success, Error, etc.)
 */
export const fireToast = (
  type: 'success' | 'warning' | 'error' | 'info',
  message: string,
  title?: string
) => {
  const toastTitle = title || type.charAt(0).toUpperCase() + type.slice(1);
  createToastUI(toastTitle, message, type);
};


/**
 * [Function] ยิง Toast จากเงื่อนไข LocalStorage (Logic คงเดิม แต่ใช้ UI ใหม่)
 */
export const fireAlertsFromSettings = () => {
  const alertSettings = localStorage.getItem("alertSettings");
  if (alertSettings) {
    for (const alertSetting of JSON.parse(alertSettings)) {
      // console.log(alertSetting); // ปิด log เพื่อความสะอาด

      const value = isNaN(parseFloat(alertSetting.value)) ? alertSetting.value : parseFloat(alertSetting.value);
      const para = alertSetting.criterion < 2 ? "delta_" + alertSetting.para : alertSetting.para;

      // Map type (0,1,2) -> ('success', 'warning', 'error')
      const toastType: 'success' | 'warning' | 'error' = alertSetting.type === '0' ? 'success' : alertSetting.type === '1' ? 'warning' : 'error';

      if (alertSetting.id === "ALL") {
        Object.keys(dataJSON).map((id: string) => {
          const item = (dataJSON as any)[id];
          if (!item) return; // Guard clause

          const condition =
            alertSetting.criterion === '0' ? value <= -1 * item[para] :
              alertSetting.criterion === '1' || alertSetting.criterion === '3' ? value >= item[para] :
                alertSetting.criterion === '2' ? value <= item[para] :
                  value === item[para];

          const realValue = alertSetting.criterion === '0' ? item[para] * -1 : item[para];

          if (condition) {
            const msg = `${alertSetting.para} of ${id} ${alertSetting.criterion == 0 ? "goes down by" :
                alertSetting.criterion == 1 ? "goes up by" :
                  alertSetting.criterion == 2 ? "is smaller than" :
                    alertSetting.criterion == 3 ? "is greater than" : "is equal to"
              } ${realValue}`;
            createToastUI(id, msg, toastType);
          }
        });
      } else {
        const id = alertSetting.id;
        const item = (dataJSON as any)[id];
        if (!item) continue; // Guard clause

        const condition =
          alertSetting.criterion === '0' ? value >= -1 * item[para] :
            alertSetting.criterion === '1' || alertSetting.criterion === '3' ? value >= item[para] :
              alertSetting.criterion === '2' ? value <= item[para] :
                value === item[para];

        const realValue = alertSetting.criterion === '0' ? item[para] * -1 : item[para];

        if (condition) {
          const msg = `${alertSetting.para} of ${id} ${alertSetting.criterion == 0 ? "goes down by" :
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