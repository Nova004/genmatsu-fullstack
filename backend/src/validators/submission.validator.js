const Joi = require('joi');

const createSubmission = Joi.object({
  formType: Joi.string().required().messages({
    'string.empty': 'Form Type is required',
    'any.required': 'Form Type is required'
  }),
  lotNo: Joi.string().required().messages({
    'string.empty': 'Lot No is required',
    'any.required': 'Lot No is required'
  }),
  templateIds: Joi.array().items(Joi.number()).min(1).required().messages({
    'array.min': 'At least one template ID is required',
    'any.required': 'Template IDs are required'
  }),
  formData: Joi.object().required().messages({
    'any.required': 'Form Data is required'
  }),
  submittedBy: Joi.string().allow(null, '').optional()
});

const updateSubmission = Joi.object({
  lot_no: Joi.string().required(),
  form_data: Joi.object().required()
});

module.exports = {
  createSubmission,
  updateSubmission
};
