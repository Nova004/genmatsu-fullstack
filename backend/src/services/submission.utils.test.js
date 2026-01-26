// Mock DB to prevent connection attempt
jest.mock('../db', () => ({
    sql: {},
    poolConnect: Promise.resolve({}),
}));

const { extractKeyMetrics } = require('./submission.service');

// Mock data
const sampleFormData = {
    basicData: {
        machineName: "Line A",
        date: "2024-01-01",
        outputQuantity: "100"
    },
    calculations: {
        finalTotalWeight: "500.50"
    },
    packingResults: {
        yieldPercent: "98.5",
        quantityOfProduct: {
            calculated: "490.00",
            cans: 50
        }
    },
    rawMaterials: {
        ncrGenmatsu: {
            actual: "10.5"
        }
    },
    operationResults: [
        { humidity: "12.5" }
    ],
    palletInfo: [
        { no: "P001", qty: 20 },
        { no: "P002", qty: 30 }
    ]
};

describe('extractKeyMetrics Utility', () => {

    test('should correctly extract basic metrics', () => {
        const result = extractKeyMetrics(sampleFormData);
        expect(result.productionLine).toBe("Line A");
        expect(result.inputKg).toBe(500.50);
        expect(result.outputKg).toBe(490.00);
        expect(result.yieldPercent).toBe(98.5);
        expect(result.totalQty).toBe(50); // Prioritizes 'cans' if available
    });

    test('should extract NCR Genmatsu Actual correctly', () => {
        const result = extractKeyMetrics(sampleFormData);
        expect(result.ncrGenmatsuActual).toBe(10.5);
    });

    test('should extract Moisture from operationResults array', () => {
        const result = extractKeyMetrics(sampleFormData);
        expect(result.moisture).toBe(12.5);
    });

    test('should extract Pallet Data correctly', () => {
        const result = extractKeyMetrics(sampleFormData);
        expect(result.palletData).toHaveLength(2);
        expect(result.palletData[0]).toEqual({ no: "P001", qty: 20 });
    });

    test('should handle missing or invalid data gracefully', () => {
        const emptyData = {};
        const result = extractKeyMetrics(emptyData);

        expect(result.inputKg).toBe(0);
        expect(result.productionLine).toBeNull();
        expect(result.ncrGenmatsuActual).toBe(0);
        expect(result.palletData).toEqual([]);
    });

    test('should prioritize multiple input paths correctly', () => {
        // rawMaterials.totalNetWeight is last priority in the list, 
        // but if calculations.finalTotalWeight is missing, it should pick this up.
        const data = {
            rawMaterials: { totalNetWeight: "999.99" }
        };
        const result = extractKeyMetrics(data);
        expect(result.inputKg).toBe(999.99);
    });
});
