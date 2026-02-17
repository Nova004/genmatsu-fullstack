
const { getObjectDiff } = require('./backend/src/utils/diffHelper');

const testCases = [
    { old: { val: 2 }, new: { val: "2.00" }, desc: "Number 2 vs String 2.00" },
    { old: { val: "2" }, new: { val: "2.00" }, desc: "String 2 vs String 2.00" },
    { old: { val: 2.00 }, new: { val: "2.00" }, desc: "Number 2.00 vs String 2.00" },
    { old: { val: "2.00" }, new: { val: "2.00 " }, desc: "String 2.00 vs String 2.00 (space)" },
];

testCases.forEach(({ old, new: newObj, desc }) => {
    console.log(`--- ${desc} ---`);
    const diff = getObjectDiff(old, newObj);
    if (diff.length === 0) {
        console.log("PASS: No diff found (Correct)");
    } else {
        console.log("FAIL: Diff found (Incorrect)");
        console.log(diff);
    }
});
