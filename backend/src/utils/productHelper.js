const { pool, sql, poolConnect } = require("../db");

/**
 * Resolves product names for a given set of product IDs (Gen_Id).
 * @param {string|string[]} productIds - Single product ID or array of product IDs.
 * @returns {Promise<Object>} - Map of { [id]: name }
 */
const resolveProductNames = async (productIds) => {
    if (!productIds) return {};
    const ids = Array.isArray(productIds) ? productIds : [productIds];
    if (ids.length === 0) return {};

    try {
        await poolConnect;
        const request = new sql.Request(pool);

        // Create parameterized query for IN clause
        const params = ids.map((id, index) => `@id${index}`);
        ids.forEach((id, index) => request.input(`id${index}`, sql.NVarChar, id));

        const query = `
      SELECT Gen_Id, Gen_Name 
      FROM AGT_SMART_SY.dbo.gen_product 
      WHERE Gen_Id IN (${params.join(',')})
    `;

        const result = await request.query(query);

        const nameMap = {};
        result.recordset.forEach(row => {
            nameMap[row.Gen_Id] = row.Gen_Name;
        });

        return nameMap;
    } catch (error) {
        console.error("Error resolving product names:", error);
        return {}; // Return empty object on error to avoid breaking main flow
    }
};

module.exports = { resolveProductNames };
