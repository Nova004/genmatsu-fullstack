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
export const formatNumberPreserve = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '';
  
  const numericVal = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numericVal)) return String(num);

  // 1. แก้ทศนิยมเพี้ยน (เช่น 3.100000004 -> 3.1)
  const multiplier = 100000000;
  const cleanNum = Math.round(numericVal * multiplier) / multiplier;

  let str = cleanNum.toString();
  const parts = str.split('.');

  // 2. เติม 0 ตามเงื่อนไข
  if (parts.length === 1) {
    return str + ".00"; // จำนวนเต็ม -> 5.00
  } else if (parts[1].length === 1) {
    return str + "0";   // ทศนิยม 1 ตำแหน่ง -> 0.40
  }
  
  // ทศนิยมครบแล้ว หรือเกิน 2 ตำแหน่ง -> คืนค่าเดิม
  return str;
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
    return formatNumberPreserve(data);
  }
  return data;
};