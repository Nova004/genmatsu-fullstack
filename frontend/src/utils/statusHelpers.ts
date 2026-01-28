/**
 * ฟังก์ชันสำหรับเลือก Class สีตามสถานะของเอกสาร
 * @param status - สถานะของเอกสาร (เช่น 'Approved', 'Pending')
 * @returns string - Class ของ Tailwind CSS ที่จะใช้แสดงผล
 */
export const getStatusColorClass = (status: string): string => {
  switch (status) {
    case 'Approved':
      return 'bg-success text-success'; // สีเขียว
    case 'Pending':
      return 'bg-warning text-warning'; // สีเหลือง
    case 'Rejected':
      return 'bg-danger text-danger'; // สีแดง
    case 'Draft':
      return 'bg-primary text-primary'; // สีน้ำเงิน (หรือสีหลัก)
    default:
      return 'bg-graydark text-white'; // สีเทา (สำหรับสถานะอื่นๆ หรือ NULL)
  }
};

/**
 * (แถม) ฟังก์ชันสำหรับแปลงสถานะเป็นภาษาไทย (เผื่อใช้ในอนาคต)
 */
export const getStatusLabelTH = (status: string): string => {
  switch (status) {
    case 'Approved':
      return 'อนุมัติแล้ว';
    case 'Pending':
      return 'รออนุมัติ';
    case 'Rejected':
      return 'ไม่อนุมัติ';
    case 'Draft':
      return 'ฉบับร่าง';
    default:
      return status;
  }
};
