const { sql, poolConnect } = require("../db");

exports.getRawMaterialWeights = async (lot, line, batch) => {
    try {
        const pool = await poolConnect;
        const query = `
      SELECT 
        det.[Material_Weight_Detail_Id],
        det.[Order_No],
        det.[Invoice_No],
        det.[Material_Lot],
        det.[Weight],
        det.[Updated_Date],
        det.[Updated_Time],
        mem.[agt_member_nameEN] AS Staff_Name,
        w.[Lot],
        w.[Batch],
        w.[Job_Status_Id],
        l.[Line_Name],
        p.[Gen_Name],
        mat.[Material_Id],
        mat.[Material_Name]
      FROM [AGT_SMART_SY].[dbo].[gen_raw_material_weight_detail] AS det
      INNER JOIN [AGT_SMART_SY].[dbo].[gen_raw_material_weight] AS w 
          ON det.[Material_Weight_Id] = w.[Material_Weight_Id]
      INNER JOIN [AGT_SMART_SY].[dbo].[gen_line] AS l
          ON w.[Line_Id] = l.[Line_Id] COLLATE DATABASE_DEFAULT
      INNER JOIN [AGT_SMART_SY].[dbo].[gen_product] AS p
          ON w.[Gen_Id] = p.[Gen_Id] COLLATE DATABASE_DEFAULT
      INNER JOIN [AGT_SMART_SY].[dbo].[gen_raw_material] AS mat 
          ON det.[Material_Id] = mat.[Material_Id] COLLATE DATABASE_DEFAULT
      LEFT JOIN [AGT_SMART_SY].[dbo].[agt_member] AS mem
          ON det.[Updated_User] = mem.[agt_member_id] COLLATE DATABASE_DEFAULT
      WHERE w.[Lot] = @lot
        AND l.[Line_Name] = @line
        AND w.[Batch] = @batch
    `;

        const result = await pool.request()
            .input('lot', sql.NVarChar, lot)
            .input('line', sql.NVarChar, line)
            .input('batch', sql.NVarChar, batch)
            .query(query);

        return result.recordset;
    } catch (error) {
        console.error("Error in getRawMaterialWeights:", error);
        throw error;
    }
};
