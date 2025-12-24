// ไว้ข้างนอก Component หรือในไฟล์ utils
export const toDecimal = (e: React.FocusEvent<HTMLInputElement>) => {
  const value = parseFloat(e.target.value);
  if (!isNaN(value)) {
    e.target.value = value.toFixed(2); // แปลงค่าใน input เป็น .00 ทันที
  }
};



// ฟังก์ชันช่วยเช็คว่าเป็นตัวเลข (number หรือ string ที่แปลงเป็น number ได้)
export const isNumeric = (val: any): val is string | number => {
  if (typeof val === 'number') return true;
  if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return true;
  return false;
};




// ฟังก์ชันจัดรูปแบบตัวเลขเดี่ยวๆ
export const formatNumberRound = (num: number | string | null | undefined): string => {
  // 1. เช็คค่าว่างเหมือนเดิม
  if (num === null || num === undefined || num === '') return '';

  const numericVal = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numericVal)) return String(num);

  // 2. คำนวณการปัดเศษ (Math.round)
  // Trick: บวก Number.EPSILON เข้าไปเล็กน้อยเพื่อแก้บั๊ก 1.005 ของ JS ที่บางทีปัดผิด
  const rounded = Math.round((numericVal + Number.EPSILON) * 100) / 100;

  // 3. แปลงเป็น String และบังคับทศนิยม 2 ตำแหน่ง
  // ตรงนี้แหละที่จะทำให้ 90.4 กลายเป็น "90.40" หรือ 90 กลายเป็น "90.00"
  return rounded.toFixed(2);
};



// ฟังก์ชันแปลงข้อมูลทั้งก้อน (Recursive)
// มันจะวิ่งเข้าไปหาตัวเลขทุกตัวใน Object/Array แล้วจับ Format หมดเลย
export const formatFormData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => formatFormData(item));
  } else if (data !== null && typeof data === 'object') {
    const newData: any = {};
    for (const key in data) {
      newData[key] = formatFormData(data[key]);
    }
    return newData;
  } else if (typeof data === 'number') {
    // 🔥 เจอตัวเลข! จับแปลงร่าง
    return formatNumberRound(data);
  }
  return data;
};


export const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    // ตัดสตริง YYYY-MM-DD ออกมาเป็นชิ้นๆ (วิธีนี้ชัวร์กว่า new Date เรื่อง Timezone)
    const [year, month, day] = dateString.split('-');
    
    // แปลงเลขเดือนเป็นชื่อเดือนย่อ
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month, 10) - 1;
    
    return `${day}-${monthNames[monthIndex]}-${year}`; // คืนค่า: 30-Apr-2025
  };
