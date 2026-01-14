import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  useWeightingCalculation,
  WeightingCalculationConfig,
} from './useWeightCalculations';

describe('useWeightingCalculation', () => {
  const mockSetValue = vi.fn();

  // Mock config
  const config: WeightingCalculationConfig = {
    rows: [
      {
        grossWeightPath: 'row1.gross' as any,
        netWeightPath: 'row1.net' as any,
        tare: 3,
      },
      {
        grossWeightPath: 'row2.gross' as any,
        netWeightPath: 'row2.net' as any,
        tare: 5,
      },
    ],
    totalPath: 'total.weight' as any,
    destinationPath: 'final.destination' as any,
  };

  it('should calculate net weights and total correctly', () => {
    // Mock watch to return gross weights: 103 and 205
    const mockWatch = vi.fn().mockReturnValue([103, 205]);

    renderHook(() =>
      useWeightingCalculation(mockWatch as any, mockSetValue, config),
    );

    // Row 1: 103 - 3 = 100
    expect(mockSetValue).toHaveBeenCalledWith('row1.net', '100.00');

    // Row 2: 205 - 5 = 200
    expect(mockSetValue).toHaveBeenCalledWith('row2.net', '200.00');

    // Total: 100 + 200 = 300
    expect(mockSetValue).toHaveBeenCalledWith('total.weight', '300.00');
    expect(mockSetValue).toHaveBeenCalledWith('final.destination', '300.00', {
      shouldValidate: true,
    });
  });

  it('should handle zero or invalid inputs correctly', () => {
    // Mock watch to return invalid/zero values
    const mockWatch = vi.fn().mockReturnValue([0, 'invalid']);

    renderHook(() =>
      useWeightingCalculation(mockWatch as any, mockSetValue, config),
    );

    // Row 1: 0 - 3 = -3 -> should be null (logic says > 0 ? net : null)
    // Actually logic: grossWeight > 0 ? gross - tare : 0.
    // If gross is 0, net is 0.
    // setValue(..., netWeight > 0 ? netWeight : null) -> 0 is not > 0, so null.
    expect(mockSetValue).toHaveBeenCalledWith('row1.net', null);

    // Row 2: 'invalid' -> Number('invalid') is NaN -> || 0 -> 0.
    // Net is 0. Result null.
    expect(mockSetValue).toHaveBeenCalledWith('row2.net', null);

    // Total: 0 + 0 = 0 -> null
    expect(mockSetValue).toHaveBeenCalledWith('total.weight', null);
    expect(mockSetValue).toHaveBeenCalledWith('final.destination', null, {
      shouldValidate: true,
    });
  });

  it('should handle partial valid inputs', () => {
    // Row 1 valid (103), Row 2 invalid (0)
    const mockWatch = vi.fn().mockReturnValue([103, 0]);

    renderHook(() =>
      useWeightingCalculation(mockWatch as any, mockSetValue, config),
    );

    // Row 1: 100
    expect(mockSetValue).toHaveBeenCalledWith('row1.net', '100.00');

    // Row 2: null
    expect(mockSetValue).toHaveBeenCalledWith('row2.net', null);

    // Total: 100 + 0 = 100
    expect(mockSetValue).toHaveBeenCalledWith('total.weight', '100.00');
    expect(mockSetValue).toHaveBeenCalledWith('final.destination', '100.00', {
      shouldValidate: true,
    });
  });
});
