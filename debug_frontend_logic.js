
const oldVal = "1004.00";
const newVal = "1004";

// Frontend logic simulation
const isChangedStrict = oldVal !== newVal;
console.log(`Strict Equality ('${oldVal}' !== '${newVal}'): ${isChangedStrict}`);

const areValuesEquivalent = (v1, v2) => {
    if (v1 === v2) return true;
    const s1 = (v1 !== null && v1 !== undefined) ? String(v1).trim() : '';
    const s2 = (v2 !== null && v2 !== undefined) ? String(v2).trim() : '';
    if (s1 === s2) return true;
    if (s1 !== '' && s2 !== '') {
        const n1 = Number(s1);
        const n2 = Number(s2);
        if (!isNaN(n1) && !isNaN(n2)) {
            const FLOAT_EPSILON = 1e-9;
            return Math.abs(n1 - n2) < FLOAT_EPSILON;
        }
    }
    return false;
};

const isChangedSmart = !areValuesEquivalent(oldVal, newVal);
console.log(`Smart Equality (Backend Logic): ${isChangedSmart}`);
