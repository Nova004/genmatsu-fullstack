const { sql, poolConnect } = require("../db");

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const pool = await poolConnect;
        const result = await pool.request().query(`
      SELECT Gen_Id, Gen_Name 
      FROM gen_product 
      ORDER BY Gen_Id ASC
    `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send({ message: "Error fetching products" });
    }
};
