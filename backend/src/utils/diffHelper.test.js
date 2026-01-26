const { getObjectDiff } = require('./diffHelper');

describe('diffHelper Utility', () => {

    test('should return empty array for identical objects', () => {
        const oldObj = { a: 1, b: 'test' };
        const newObj = { a: 1, b: 'test' };
        expect(getObjectDiff(oldObj, newObj)).toEqual([]);
    });

    test('should detect basic field changes', () => {
        const oldObj = { name: 'John', age: 30 };
        const newObj = { name: 'John', age: 31 };
        const result = getObjectDiff(oldObj, newObj);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain('age: 30 -> 31');
    });

    test('should ignore numeric string differences (Smart Numeric Check)', () => {
        const oldObj = { weight: 13.00, price: '50.00' };
        const newObj = { weight: 13, price: 50 };
        // Should be considered "Same"
        expect(getObjectDiff(oldObj, newObj)).toEqual([]);
    });

    test('should detect actual numeric changes even with format diff', () => {
        const oldObj = { weight: '13.00' };
        const newObj = { weight: 13.5 };
        const result = getObjectDiff(oldObj, newObj);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain('weight: 13.00 -> 13.5');
    });

    test('should handle nested objects', () => {
        const oldObj = { meta: { author: 'Admin', version: 1 } };
        const newObj = { meta: { author: 'User', version: 1 } };
        const result = getObjectDiff(oldObj, newObj);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain('meta.author: Admin -> User');
    });

    test('should handle array element changes recursively', () => {
        const oldObj = {
            users: [
                { id: 1, name: 'A' },
                { id: 2, name: 'B' }
            ]
        };
        const newObj = {
            users: [
                { id: 1, name: 'A' },
                { id: 2, name: 'C' } // Changed
            ]
        };
        const result = getObjectDiff(oldObj, newObj);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain('users[1].name: B -> C');
    });

    test('should handle array changes (add/remove)', () => {
        const oldObj = { tags: ['a', 'b'] };
        const newObj = { tags: ['a', 'b', 'c'] };
        const result = getObjectDiff(oldObj, newObj);
        expect(result).toHaveLength(1);
        expect(result[0]).toContain('tags[2]: (empty) -> "c"');
    });
});
