// รายชื่อฟอร์มของกลุ่ม Recycle
export const availableForms_Recycle = [
  {
    id: 'submissionId',
    title: 'Iron Powder Production Report',
    tableName: 'Form_Ironpowder_Submissions', // ใช้สำหรับอ้างอิง (ถ้าจำเป็น)
  },
  // อนาคตเพิ่มฟอร์มอื่นๆ ได้ที่นี่
];



export const availableForms = [
    { value: 'AZ-R', label: 'AZ-R', path: '/forms/az-r-form' },
    { value: 'AS2-R', label: 'AS2-R', path: '/forms/as2-r-form' },
    { value: 'AS2-DR', label: 'AS2-DR', path: '/forms/as2-dr-form' },
];

// คุณอาจจะ export ค่าคงที่อื่นๆ ที่เกี่ยวข้องไว้ในไฟล์นี้ด้วยก็ได้
export const DEFAULT_PATH = '/forms';