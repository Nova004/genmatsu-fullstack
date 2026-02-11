// location: frontend/src/components/formGen/pages/GEN_B/availableForms_GENB.ts
export const availableForms = [
  { value: 'G014', label: 'BZ', path: '/forms/bz-form' },
  { value: 'G013', label: 'BS-B', path: '/forms/bs-b-form' },
  { value: 'G012', label: 'BS', path: '/forms/bs-form' },
  { value: 'G011', label: 'BN', path: '/forms/bn-form' },
  //{ value: 'G015', label: 'BZ3', path: '/forms/bz3-form' }, ยกเลิกแบบฟอร์ม BZ3
  { value: 'G016', label: 'BZ3-B', path: '/forms/bz3-b-form' },
  // { value: 'G017', label: 'BS3', path: '/forms/bs3-form' }, ยกเลิกแบบฟอร์ม BS3
  { value: 'G010', label: 'BS3-B', path: '/forms/bs3-b-form' }, // Note: Text file says G010 is 'BS3-B' but user code had 'BS3-B'. Wait, text file has G010 BS3-B. And user code has BS3-B. Correct.
  { value: 'G030', label: 'BS3-B1', path: '/forms/bs3-b1-form' },
  { value: 'G025', label: 'BS3-C', path: '/forms/bs3-c-form' },
  { value: 'G028', label: 'BZ5-C', path: '/forms/bz5-c-form' },
  { value: 'G029', label: 'BS5-C', path: '/forms/bs5-c-form' },
];

// คุณอาจจะ export ค่าคงที่อื่นๆ ที่เกี่ยวข้องไว้ในไฟล์นี้ด้วยก็ได้
export const DEFAULT_PATH = '/forms';
