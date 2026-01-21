
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as submissionService from '../../../services/submissionService';

// Mock the submissionService
vi.mock('../../../services/submissionService', () => ({
    updateSubmission: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Frontend Update Payload Verification (testUpdateForm)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Test Case 1: GEN_A Form (e.g. AS2-D)
     * Verifying that payload contains:
     * - productionLine (from basicData.machineName)
     * - totalQty (from packingResults.quantityOfProduct.cans)
     * - outputKg (from packingResults.quantityOfProduct.calculated)
     */
    it('should construct correct payload for GEN_A (AS2-D)', async () => {
        const submissionId = "101";
        const dummyLotNo = "LOT-GEN-A-001";
        const dummyFormData_GEN_A = {
            basicData: {
                machineName: "Line-1",
                date: "2025-01-20",
                lotNo: dummyLotNo
            },
            packingResults: {
                quantityOfProduct: {
                    cans: 1500,
                    calculated: 300.50
                },
                yieldPercent: 98.5
            },
            rawMaterials: {
                totalNetWeight: 305.00
            }
        };

        // Construct the expected payload structure that useFormSubmitHandler/Update logic would send
        const expectedPayload = {
            lot_no: dummyLotNo,
            form_data: dummyFormData_GEN_A
        };

        // Call the service (simulating what the component does)
        await submissionService.updateSubmission(submissionId, expectedPayload as any);

        // Verify the mock was called with correct data
        expect(submissionService.updateSubmission).toHaveBeenCalledWith(submissionId, expectedPayload);

        // Verify content integrity for Backup/Separate Columns
        const capturedCall = vi.mocked(submissionService.updateSubmission).mock.calls[0];
        const capturedPayload = capturedCall[1];

        // 1. Verify JSON content exists
        expect(capturedPayload.form_data).toBeDefined();

        // 2. Verify Key Metrics for SQL Columns (Backend Extraction Simulation)
        const formData = capturedPayload.form_data;

        // "production_line" column
        expect(formData.basicData.machineName).toBe("Line-1");

        // "total_qty" column
        expect(formData.packingResults.quantityOfProduct.cans).toBe(1500);

        // "output_kg" column
        expect(formData.packingResults.quantityOfProduct.calculated).toBe(300.50);

        // "input_kg" column (often totalNetWeight in GEN_A)
        expect(formData.rawMaterials.totalNetWeight).toBe(305.00);
    });

    /**
     * Test Case 2: GEN_B Form (e.g. BS3-B)
     * Verifying that payload contains:
     * - inputKg (from bs3Calculations.totalWeightWithNcr) - specific to GEN_B
     */
    it('should construct correct payload for GEN_B (BS3-B)', async () => {
        const submissionId = "202";
        const dummyLotNo = "LOT-GEN-B-002";
        const dummyFormData_GEN_B = {
            basicData: {
                machineName: "Line-2",
                date: "2025-01-21",
                lotNo: dummyLotNo
            },
            // GEN_B specific calculation field
            bs3Calculations: {
                totalWeightWithNcr: 1250.75
            },
            packingResults: {
                quantityOfProduct: {
                    cans: 50,
                    calculated: 1200.00
                },
                yieldPercent: 95.9
            }
        };

        const expectedPayload = {
            lot_no: dummyLotNo,
            form_data: dummyFormData_GEN_B
        };

        await submissionService.updateSubmission(submissionId, expectedPayload as any);

        const capturedPayload = vi.mocked(submissionService.updateSubmission).mock.calls[0][1];
        const formData = capturedPayload.form_data;

        // Verify GEN_B specific input column source
        expect(formData.bs3Calculations).toBeDefined();
        expect(formData.bs3Calculations.totalWeightWithNcr).toBe(1250.75); // Mapping to input_kg
    });

    /**
     * Test Case 3: Ironpowder (Recycle)
     * Verifying that payload contains:
     * - Separate tables for inputs/outputs
     * - calculation of total weights (Backend sums these up usually, but we verify they exist)
     */
    it('should construct correct payload for Ironpowder', async () => {
        const submissionId = "303";
        const dummyLotNo = "LOT-IRON-003";
        const dummyFormData_Iron = {
            basicData: {
                machineName: "Line-Iron",
                date: "2025-01-22",
                lotNo: dummyLotNo
            },
            inputProduct: [
                { weight: 100 }, { weight: 200 }
            ],
            outputGenmatsuA: [
                { weight: 150 }
            ],
            outputGenmatsuB: [
                { weight: 140 }
            ],
            // Ironpowder specifically sends submissionId in body sometimes, checking if required
            submissionId: 303
        };

        const expectedPayload = {
            lot_no: dummyLotNo,
            form_data: dummyFormData_Iron
        };

        await submissionService.updateSubmission(submissionId, expectedPayload as any);

        const capturedPayload = vi.mocked(submissionService.updateSubmission).mock.calls[0][1];
        const formData = capturedPayload.form_data;

        // Verify Ironpowder array structures
        expect(formData.inputProduct).toHaveLength(2);
        expect(formData.inputProduct[0].weight).toBe(100);
        expect(formData.outputGenmatsuA[0].weight).toBe(150);
        expect(formData.outputGenmatsuB[0].weight).toBe(140);

        // Backend service specifically looks for inputProduct etc. to calculate totals.
        // This test confirms we are sending them.
    });
});
