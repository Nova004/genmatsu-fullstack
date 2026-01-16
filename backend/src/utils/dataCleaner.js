exports.cleanSubmissionData = (data) => {
    if (!data) return data;

    // Clone ข้อมูลเพื่อความปลอดภัย
    const cleaned = JSON.parse(JSON.stringify(data));

    // ฟังก์ชันเช็คค่าว่าง
    const isEmpty = (value) => {
        if (value === null || value === undefined) return true;
        if (typeof value === "string" && value.trim() === "") return true;
        if (
            typeof value === "object" &&
            !Array.isArray(value) &&
            Object.keys(value).length === 0
        )
            return true; // Object ว่าง {}
        return false;
    };

    // 1. กรอง Array ทั่วไป (ส่วนนี้เหมือนเดิม ไม่ต้องแก้)
    if (Array.isArray(cleaned.mcOperators)) {
        cleaned.mcOperators = cleaned.mcOperators.filter(
            (item) => item.id && item.id.toString().trim() !== ""
        );
    }
    if (Array.isArray(cleaned.assistants)) {
        cleaned.assistants = cleaned.assistants.filter(
            (item) => item.id && item.id.toString().trim() !== ""
        );
    }
    if (Array.isArray(cleaned.palletInfo)) {
        cleaned.palletInfo = cleaned.palletInfo.filter(
            (item) => item.no && item.no.toString().trim() !== ""
        );
    }

    // 2. ฟังก์ชัน Recursive ฉบับปรับปรุง (เพิ่ม preserveStructure)
    const deepClean = (obj, preserveStructure = false) => {
        if (Array.isArray(obj)) {
            // วนลูป Clean ลูกหลานก่อน
            const mapped = obj.map((item) => deepClean(item, preserveStructure));

            // 🚩 จุดแก้ไขสำคัญ: ถ้ามีคำสั่งให้รักษารูปแบบ (preserveStructure)
            // หรืออยู่ใน operationResults ให้คืนค่ากลับไปเลย ห้าม Filter!
            if (preserveStructure) {
                return mapped;
            }

            // ถ้าไม่ใช่เขตหวงห้าม ก็กรองตัวว่างทิ้งตามปกติ (เพื่อให้ JSON เล็ก)
            return mapped.filter((item) => !isEmpty(item));
        } else if (typeof obj === "object" && obj !== null) {
            Object.keys(obj).forEach((key) => {
                const val = obj[key];

                // Trim String
                if (typeof val === "string") {
                    obj[key] = val.trim();
                }

                // เช็คว่าตอนนี้กำลังจะเข้าสู่เขตหวงห้ามหรือไม่?
                // 1. ถ้า Key ปัจจุบันคือ "operationResults" -> ถือว่าเข้าเขตหวงห้าม
                // 2. หรือถ้า Parent ส่งมาว่าหวงห้ามอยู่แล้ว (preserveStructure) -> ก็หวงห้ามต่อไป
                const isStrictZone = key === "operationResults" || preserveStructure;

                // Recursive ต่อโดยส่งสถานะ isStrictZone ไปด้วย
                obj[key] = deepClean(obj[key], isStrictZone);

                // ถ้า Clean แล้วว่าง ให้ลบ Key ทิ้ง (ลบ Key Object ไม่กระทบ Index ของ Array ข้อมูลไม่เพี้ยน)
                if (isEmpty(obj[key])) {
                    delete obj[key];
                }
            });
        }
        return obj;
    };

    return deepClean(cleaned);
}