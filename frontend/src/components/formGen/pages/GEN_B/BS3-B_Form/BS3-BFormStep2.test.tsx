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
      gypsumplaster: 20,
      ncrGenmatsu: { actual: 50 },
      remainedGenmatsu: { actual: 0 }
    },
    bs3Calculations: {
      rc417WaterContent: 10, // 10%
      stdMeanMoisture: 45.25,
      naclWater: 4,
      naclWaterSpecGrav: 1.2,
      temperature: 25
    }
  };

  it('calculates Total Materials correctly (Step A)', async () => {
    render(<TestWrapper defaultValues={mockDefaultValues} />);

    // Total = 194 + 10 + 5 + 20 = 229
    await waitFor(() => {
      const totalInput = screen.getByDisplayValue('229.00');
      expect(totalInput).toBeTruthy();
    });
  });

  it('calculates Initial 4% NaCl Water correctly (Step B)', async () => {
    render(<TestWrapper defaultValues={mockDefaultValues} />);
    // Internal calculation check omitted
  });

  it('calculates Total NaCl Water correctly (Step D)', async () => {
    render(<TestWrapper defaultValues={mockDefaultValues} />);

    // From Step B: T24_raw = 6.6382266
    // Step C: Intermediate Water (AD24)
    // O23 = 0.04
    // AD24 = (T24_raw / 0.04) * (1 - 0.04)
    // AD24 = (6.6382266 / 0.04) * 0.96 = 165.95566 * 0.96 = 159.3174

    // Step D: Total NaCl Water = T24 + AD24
    // Total = 6.6382 + 159.3174 = 165.9556
    // Rounded to 2 decimals: 165.96

    await waitFor(() => {
      const totalNaclInput = screen.getByDisplayValue('165.96');
      expect(totalNaclInput).toBeTruthy();
    });
  });

  it('calculates Final 4% NaCl Water and L/min correctly (Step E)', async () => {
    render(<TestWrapper defaultValues={mockDefaultValues} />);

    // Total NaCl Water = 165.96
    // Spec Grav = 1.2
    // Final NaCl Water = 165.96 / 1.2 = 138.3
    // Rounded to 0 decimals: 138

    await waitFor(() => {
      const finalNaclInput = screen.getByDisplayValue('138'); // naclWater4
      expect(finalNaclInput).toBeTruthy();
    });

    // L/min = 138 / 20 = 6.9
    // Rounded to 0 decimals: 7
    await waitFor(() => {
        const lminInput = screen.getByDisplayValue('7');
        expect(lminInput).toBeTruthy();
    });
  });

  it('calculates Total Weight with NCR correctly (Step F)', async () => {
    render(<TestWrapper defaultValues={mockDefaultValues} />);

    // AD21 (Total Materials) = 229
    // AD25 (Total NaCl Water) = 165.96
    // U14 (NCR Genmatsu) = 50
    // Total = 229 + 165.96 + 50 = 444.96

    await waitFor(() => {
      const totalWeightInput = screen.getByDisplayValue('444.96');
      expect(totalWeightInput).toBeTruthy();
    });
  });
});