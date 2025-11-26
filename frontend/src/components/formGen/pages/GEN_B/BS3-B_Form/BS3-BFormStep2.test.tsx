import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { vi, describe, it, expect } from 'vitest';
import FormStep2 from './FormStep2';

// Mock components and hooks
vi.mock('../../../components/forms/RawMaterialTableRows', () => ({
  default: () => <tr><td>Raw Material Rows</td></tr>
}));

vi.mock('../../../../../hooks/useTemplateLoader', () => ({
  useTemplateLoader: () => ({
    fields: [],
    isLoading: false,
    error: null
  })
}));

vi.mock('../../../../../hooks/useWeightCalculations', () => ({
  useWeightingCalculation: vi.fn(),
  WeightingCalculationConfig: {}
}));

// Test wrapper component
const TestWrapper = ({ defaultValues }: { defaultValues: any }) => {
  const methods = useForm({ defaultValues });
  return (
    <FormProvider {...methods}>
      <FormStep2
        register={methods.register}
        watch={methods.watch}
        setValue={methods.setValue}
        errors={methods.formState.errors}
        onTemplateLoaded={vi.fn()}
      />
    </FormProvider>
  );
};

describe('BS3-B FormStep2 Calculations', () => {
  const mockDefaultValues = {
    rc417Weighting: {
      row1: { weight: 100, bagNo: 'A1', net: 97 },
      row2: { weight: 100, bagNo: 'A2', net: 97 },
      total: 194
    },
    rawMaterials: {
      magnesiumHydroxide: 10,
      activatedcarbon: 5,
      gypsumplaster: 20, // Specific to BS3-B
      ncrGenmatsu: { actual: 50 },
      remainedGenmatsu: { actual: 0 }
    },
    bs3Calculations: {
      rc417WaterContent: 10, // 10%
      naclWaterSpecGrav: 1.2,
      temperature: 25,
      stdMeanMoisture: 45.25, // Fixed value in component
      naclWater: 4 // Fixed value in component
    }
  };

  it('calculates Total Materials correctly (Step A) including Gypsum Plaster', async () => {
    render(<TestWrapper defaultValues={mockDefaultValues} />);

    // Total = 194 (RC417) + 10 (Mg) + 5 (Carbon) + 20 (Gypsum) = 229
    await waitFor(() => {
      const totalInput = screen.getByDisplayValue('229.00');
      expect(totalInput).toBeTruthy();
    });
  });

  it('calculates Total NaCl Water correctly (Step D)', async () => {
    render(<TestWrapper defaultValues={mockDefaultValues} />);

    // Step A: AD21 = 229
    // Step B: Initial 4% NaCl Water (T24)
    // Q21 (RC417 Water) = 0.10
    // Q22 (Std Moisture) = 0.4525
    // O23 (NaCl) = 0.04
    // Q20 (RC417 Total) = 194

    // Denominator = 1 - 0.04 - 0.4525 = 0.5075
    // Numerator = (229 * 0.4525) - (194 * 0.10) 
    //           = 103.6225 - 19.4 = 84.2225

    // T24_raw = (84.2225 / 0.5075) * 0.04 = 165.95566 * 0.04 = 6.63822

    // Step C: Intermediate Water (AD24)
    // Water Ratio = 1 - 0.04 = 0.96
    // AD24 = (6.63822 / 0.04) * 0.96 = 165.9555 * 0.96 = 159.31728

    // Step D: Total NaCl Water = T24 + AD24
    // Total = 6.63822 + 159.31728 = 165.9555
    // Rounded to 2 decimals: 165.96 (or 165.95 depending on precision)

    // Let's check logic:
    // T24 + AD24 = T24 + (T24/0.04)*0.96 = T24 * (1 + 0.96/0.04) = T24 * (1 + 24) = T24 * 25
    // T24 * 25 = 6.63822 * 25 = 165.9555

    await waitFor(() => {
      // Allow for small rounding differences
      const totalNaclInput = screen.getByDisplayValue(/165.9[56]/);
      expect(totalNaclInput).toBeTruthy();
    });
  });

  it('calculates Final 4% NaCl Water and L/min correctly (Step E)', async () => {
    render(<TestWrapper defaultValues={mockDefaultValues} />);

    // Total NaCl Water = 165.96 (approx)
    // Spec Grav = 1.2
    // Final NaCl Water = 165.96 / 1.2 = 138.3

    await waitFor(() => {
      const finalNaclInput = screen.getByDisplayValue('138'); // toFixed(0) in code -> 138
      expect(finalNaclInput).toBeTruthy();
    });

    // L/min = 138 / 20 = 6.9
    // Rounded to 0 decimals: 7
    await waitFor(() => {
      const lminInput = screen.getByDisplayValue('7');
      expect(lminInput).toBeTruthy();
    });
  });
});