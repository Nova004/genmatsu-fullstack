const weightService = require("../services/weight.service");

exports.getRawMaterialWeights = async (req, res) => {
    try {
        const { lot, line, batch } = req.query;

        // Validate inputs
        if (!lot || !line || !batch) {
            return res.status(400).json({
                message: "Parameters 'lot', 'line', and 'batch' are required."
            });
        }

        const data = await weightService.getRawMaterialWeights(lot, line, batch);
        res.status(200).json(data);
    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};
