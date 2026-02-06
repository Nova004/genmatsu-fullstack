const weightRepository = require("../repositories/weight.repository");

exports.getRawMaterialWeights = async (lot, line, batch) => {
    if (!lot || !line || !batch) {
        throw new Error("Missing required parameters: lot, line, batch");
    }
    return await weightRepository.getRawMaterialWeights(lot, line, batch);
};
