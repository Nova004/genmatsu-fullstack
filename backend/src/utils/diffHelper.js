/**
 * Deep compare two objects and return a summary of changes
 * @param {Object} oldObj - The original object
 * @param {Object} newObj - The new object
 * @param {String} prefix - Key prefix for nested objects (used internally)
 * @returns {Array} List of changes, e.g. ["field: old -> new"]
 */
// Helper: check if valid object (not array, not null)
const paramIsObject = (val) => {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
};

// Helper: Check if two values are equivalent (handling numbers and strings)
const areValuesEquivalent = (v1, v2) => {
    // 1. Strict equality first
    if (v1 === v2) return true;

    // 2. Handle null/undefined vs empty string (optional, depends on requirement)
    // If we want '' == null or something, add here. currently sticking to safe checks.

    // 3. Numeric comparison (e.g. "13.00" == 13)
    // Check if both are "numeric"
    const n1 = Number(v1);
    const n2 = Number(v2);

    // Ensure they are valid numbers (not NaN) and not empty strings/whitespace
    // (Number('') === 0, which might be unsafe if we check against '0')
    const isValidN1 = v1 !== null && v1 !== undefined && String(v1).trim() !== '' && !isNaN(n1);
    const isValidN2 = v2 !== null && v2 !== undefined && String(v2).trim() !== '' && !isNaN(n2);

    if (isValidN1 && isValidN2) {
        // Compare with small epsilon for float safety
        return Math.abs(n1 - n2) < Number.EPSILON;
    }

    // 4. Fallback: string comparison (e.g. "foo" vs "foo")
    return String(v1) === String(v2);
};

const getObjectDiff = (oldObj, newObj, prefix = "") => {
    let changes = [];

    // If one side is null/undefined and other isn't
    if (!oldObj && newObj) return [`${prefix}: (empty) -> ${JSON.stringify(newObj).substring(0, 20)}...`];
    if (oldObj && !newObj) return [`${prefix}: ${JSON.stringify(oldObj).substring(0, 20)}... -> (deleted)`];

    // Get unique keys from both objects
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    allKeys.forEach((key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const oldVal = oldObj ? oldObj[key] : undefined;
        const newVal = newObj ? newObj[key] : undefined;

        // Skip specific keys we don't care about (optional)
        if (key === 'updated_at' || key === 'created_at') return;

        if (paramIsObject(oldVal) && paramIsObject(newVal)) {
            // Recursive call for nested objects
            changes = changes.concat(getObjectDiff(oldVal, newVal, fullKey));
        } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
            // ✅ Improved Array Diff: Check elements by index
            const maxLen = Math.max(oldVal.length, newVal.length);

            for (let i = 0; i < maxLen; i++) {
                const itemOld = oldVal[i];
                const itemNew = newVal[i];
                const itemKey = `${fullKey}[${i}]`; // e.g. operationResults[0]

                if (i >= oldVal.length) {
                    // New item added
                    changes.push(`${itemKey}: (empty) -> ${JSON.stringify(itemNew).substring(0, 30)}...`);
                } else if (i >= newVal.length) {
                    // Item removed
                    changes.push(`${itemKey}: ${JSON.stringify(itemOld).substring(0, 30)}... -> (deleted)`);
                } else if (paramIsObject(itemOld) && paramIsObject(itemNew)) {
                    // Recurse for objects inside array
                    changes = changes.concat(getObjectDiff(itemOld, itemNew, itemKey));
                } else if (Array.isArray(itemOld) && Array.isArray(itemNew)) {
                    // Recurse for nested arrays
                    changes = changes.concat(getObjectDiff(itemOld, itemNew, itemKey));
                } else if (!areValuesEquivalent(itemOld, itemNew)) {
                    // Primitive change inside array
                    const safeOld = itemOld === undefined ? '(empty)' : itemOld;
                    const safeNew = itemNew === undefined ? '(empty)' : itemNew;
                    changes.push(`${itemKey}: ${safeOld} -> ${safeNew}`);
                }
            }
        } else {
            // Compare primitives using smart equivalence
            if (!areValuesEquivalent(oldVal, newVal)) {
                // Handle undefined/null specifically for better readability
                const safeOld = oldVal === undefined ? '(empty)' : oldVal;
                const safeNew = newVal === undefined ? '(empty)' : newVal;

                // Limit value length
                const shortOld = String(safeOld).substring(0, 30);
                const shortNew = String(safeNew).substring(0, 30);
                changes.push(`${fullKey}: ${shortOld} -> ${shortNew}`);
            }
        }
    });

    return changes;
};

module.exports = {
    getObjectDiff
};
