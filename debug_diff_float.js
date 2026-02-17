
const { getObjectDiff } = require('./backend/src/utils/diffHelper');

const testCases = [
    { old: { val: 2 }, new: { val: 2 + Number.EPSILON * 2 }, desc: "2 vs 2 + 2*EPSILON" },
    { old: { val: 2 }, new: { val: 2.000000000000001 }, desc: "2 vs 2.000000000000001" },
];

testCases.forEach(({ old, new: newObj, desc }) => {
    console.log(`--- ${desc} ---`);
    const diff = getObjectDiff(old, newObj);
    if (diff.length === 0) {
        console.log("PASS: No diff found (Correct?)");
    } else {
        console.log("FAIL: Diff found (Strict Check)");
        console.log(diff);
    }
});
