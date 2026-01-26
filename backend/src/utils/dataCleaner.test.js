const { cleanSubmissionData } = require('./dataCleaner');

describe('Data Cleaner Utility', () => {

    test('should return null/undefined as is', () => {
        expect(cleanSubmissionData(null)).toBeNull();
        expect(cleanSubmissionData(undefined)).toBeUndefined();
    });

    test('should remove empty strings and nulls from objects', () => {
        const input = {
            name: "John",
            emptyStr: "",
            nullVal: null,
            nested: {
                val: "ok",
                empty: ""
            }
        };
        const result = cleanSubmissionData(input);
        expect(result.emptyStr).toBeUndefined();
        expect(result.nullVal).toBeUndefined();
        expect(result.name).toBe("John");
        expect(result.nested.empty).toBeUndefined();
    });

    test('should clean array items with empty IDs', () => {
        const input = {
            mcOperators: [
                { id: "1", name: "A" },
                { id: "", name: "B" }, // Should be removed
                { id: "  ", name: "C" } // Should be removed
            ]
        };
        const result = cleanSubmissionData(input);
        expect(result.mcOperators).toHaveLength(1);
        expect(result.mcOperators[0].id).toBe("1");
    });

    test('should Preserve Structure for operationResults (Special Case)', () => {
        const input = {
            operationResults: [
                { startTime: "08:00" },
                {}, // Empty object should be PRESERVED in this array
                { startTime: "09:00" }
            ]
        };
        const result = cleanSubmissionData(input);
        expect(result.operationResults).toHaveLength(3); // Should kept empty object
        expect(result.operationResults[1]).toEqual({});
    });

    test('should trim string values', () => {
        const input = { name: "  John  " };
        const result = cleanSubmissionData(input);
        expect(result.name).toBe("John");
    });
});
