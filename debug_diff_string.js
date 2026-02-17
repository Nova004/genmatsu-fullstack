
const { getObjectDiff } = require('./backend/src/utils/diffHelper');

const testCases = [
    { old: { val: "1004.00" }, new: { val: "1004" }, desc: "String '1004.00' vs String '1004'" },
    { old: { val: "1004.00" }, new: { val: 1004 }, desc: "String '1004.00' vs Number 1004" },
    { old: { val: "2.66" }, new: { val: 2.66 }, desc: "String '2.66' vs Number 2.66" },
];

testCases.forEach(({ old, new: newObj, desc }) => {
    console.log(`--- ${desc} ---`);
    const diff = getObjectDiff(old, newObj);
    if (diff.length === 0) {
        console.log("PASS: No diff found");
    } else {
        console.log("FAIL: Diff found");
        console.log(diff);
    }
});
