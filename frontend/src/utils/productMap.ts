// This file is auto-generated based on Gen_Product_MT
// Use this to map between Gen_Id and Gen_Name

export const PRODUCT_ID_MAP: Record<string, string> = {
  AS2: 'G001',
  'AX2-B': 'G002',
  AX2: 'G003',
  AZ: 'G004',
  'AS2-B': 'G005',
  AJ4: 'G006',
  AS4: 'G007',
  AK2: 'G008',
  'AS2-D': 'G009',
  'BS3-B': 'G010',
  BN: 'G011',
  BS: 'G012',
  'BS-B': 'G013',
  BZ: 'G014',
  BZ3: 'G015',
  'BZ3-B': 'G016',
  BS3: 'G017',
  BZ8: 'G018',
  BK8: 'G019',
  'AZ-D': 'G020',
  'AX9-B': 'G021',
  AZ1: 'G022',
  'BS4-B': 'G023',
  'BZ4-B': 'G024',
  'BS3-C': 'G025',
  'BS3-D': 'G026',
  'BZ3-C': 'G027',
  'BZ5-C': 'G028',
  'BS5-C': 'G029',
  'BS3-B1': 'G030',
  ZE: 'G031',
  'ZE-1A': 'G032',
  'AX8-B': 'G033',
  'AX8-C': 'G034',
  'BS6-C': 'G035',
  'BZ6-C': 'G036',
  'AZ-R': 'Genmatsu Recycle', // Special Case? Need to check Recycle names
  'AS2-R': 'Genmatsu Recycle',
  'AS2-DR': 'Genmatsu Recycle',
};

export const PRODUCT_NAME_MAP: Record<string, string> = {
  G001: 'AS2',
  G002: 'AX2-B',
  G003: 'AX2',
  G004: 'AZ',
  G005: 'AS2-B',
  G006: 'AJ4',
  G007: 'AS4',
  G008: 'AK2',
  G009: 'AS2-D',
  G010: 'BS3-B',
  G011: 'BN',
  G012: 'BS',
  G013: 'BS-B',
  G014: 'BZ',
  G015: 'BZ3',
  G016: 'BZ3-B',
  G017: 'BS3',
  G018: 'BZ8',
  G019: 'BK8',
  G020: 'AZ-D',
  G021: 'AX9-B',
  G022: 'AZ1',
  G023: 'BS4-B',
  G024: 'BZ4-B',
  G025: 'BS3-C',
  G026: 'BS3-D',
  G027: 'BZ3-C',
  G028: 'BZ5-C',
  G029: 'BS5-C',
  G030: 'BS3-B1',
  G031: 'ZE',
  G032: 'ZE-1A',
  G033: 'AX8-B',
  G034: 'AX8-C',
  G035: 'BS6-C',
  G036: 'BZ6-C',
};

// Returns Gen_Id if found, otherwise returns the name itself (fallback)
export const getProductId = (name: string): string => {
  return PRODUCT_ID_MAP[name] || name;
};

// Returns Gen_Name if found, otherwise returns the ID itself (fallback)
export const getProductName = (id: string): string => {
  return PRODUCT_NAME_MAP[id] || id;
};
