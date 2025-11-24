/**
 * Form Constants
 * 
 * Centralized constants for all manufacturing report forms.
 * This file contains all magic numbers, fixed values, and configuration
 * used across different form types.
 */

/**
 * Form-specific calculation constants
 */
export const FORM_CONSTANTS = {
  BZ3_B: {
    STD_MEAN_MOISTURE: 39.50,
    NACL_WATER_PERCENT: 15,
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BS3_B: {
    STD_MEAN_MOISTURE: 45.25,
    NACL_WATER_PERCENT: 4,
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BS3_B1: {
    STD_MEAN_MOISTURE: 45.25,
    NACL_WATER_PERCENT: 4,
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BS3_C: {
    STD_MEAN_MOISTURE: 45.25,
    NACL_WATER_PERCENT: 4,
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BS3: {
    STD_MEAN_MOISTURE: 45.25,
    NACL_WATER_PERCENT: 4,
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BS5_C: {
    NET_WEIGHT_OF_WATER_PER: 649.814400000,
    TARE_WEIGHT: 3,
  },
  BZ3: {
    STD_MEAN_MOISTURE: 39.50,
    NACL_WATER_PERCENT: 15,
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BZ5_C: {
    TARE_WEIGHT: 3,
  },
  BN: {
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BS: {
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BS_B: {
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
  BZ: {
    TARE_WEIGHT: 3,
    NET_WEIGHT_OF_YIELD: 800,
  },
} as const;

/**
 * Calculation-related constants
 */
export const CALCULATION_CONSTANTS = {
  /** Number of minutes for L/min calculation */
  LMIN_DIVISOR: 20,
  
  /** Water ratio (85% of NaCl solution) */
  WATER_RATIO: 0.85,
  
  /** Salt ratio (15% of NaCl solution) */
  SALT_RATIO: 0.15,
  
  /** Percentage divisor for decimal conversion */
  PERCENTAGE_DIVISOR: 100,
} as const;

/**
 * Decimal precision for different types of calculations
 */
export const DECIMAL_PRECISION = {
  /** Weight calculations (e.g., total materials, final weight) */
  WEIGHT: 2,
  
  /** Volume calculations (e.g., NaCl water) */
  VOLUME: 1,
  
  /** Rate calculations (e.g., L/min) */
  RATE: 0,
  
  /** Percentage calculations */
  PERCENTAGE: 2,
} as const;

/**
 * Form template names for each form type
 */
export const TEMPLATE_NAMES = {
  BZ3_B: {
    STEP2_RAW_MATERIALS: 'BZ3-B_Step2_RawMaterials',
    STEP3_OPERATIONS: 'BZ3-B_Step3_Operations',
    STEP4_PACKING: 'BZ3-B_Step4_Packing',
  },
  BS3_B: {
    STEP2_RAW_MATERIALS: 'BS3-B_Step2_RawMaterials',
    STEP3_OPERATIONS: 'BS3-B_Step3_Operations',
    STEP4_PACKING: 'BS3-B_Step4_Packing',
  },
  BS3_B1: {
    STEP2_RAW_MATERIALS: 'BS3-B1_Step2_RawMaterials',
    STEP3_OPERATIONS: 'BS3-B1_Step3_Operations',
    STEP4_PACKING: 'BS3-B1_Step4_Packing',
  },
  BS3_C: {
    STEP2_RAW_MATERIALS: 'BS3-C_Step2_RawMaterials',
    STEP3_OPERATIONS: 'BS3-C_Step3_Operations',
    STEP4_PACKING: 'BS3-C_Step4_Packing',
  },
  // Add more as needed
} as const;

/**
 * Type helper to get form type keys
 */
export type FormType = keyof typeof FORM_CONSTANTS;

/**
 * Helper function to get constants for a specific form type
 */
export const getFormConstants = (formType: FormType) => {
  return FORM_CONSTANTS[formType];
};

export default FORM_CONSTANTS;
