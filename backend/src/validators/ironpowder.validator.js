// backend/src/validators/ironpowder.validator.js

const Joi = require("joi");

const ironpowderSchemas = {
  createIronpowder: Joi.object({
    lotNo: Joi.string().required().messages({
      "string.empty": "Lot No. is required",
    }),
    formData: Joi.object().required().messages({
      "object.base": "Form data must be an object",
    }),
    submittedBy: Joi.number().required(),
  }),

  updateIronpowder: Joi.object({
    formData: Joi.object().required().messages({
      "object.base": "Form data must be an object",
    }),
  }),
};

module.exports = ironpowderSchemas;
