const validator = require("validator");
const logger = require("../../libraries/log/logger");
const { ValidatorError } = require("../../libraries/error-handling/AppError");

function validateRequest({ schema, isParam = false, isQuery = false }) {
  return (req, res, next) => {
    const input = isParam ? req.params : isQuery ? req.query : req.body;

    for (let key in input) {
      if (typeof input[key] == "string") {
        input[key] = validator.escape(input[key]);
      }
    }

    const validationResult = schema.validate(input, { abortEarly: false });

    if (validateResult.error) {
      logger.error(`${req.method} ${req.originalUrl} Validation failed`, {
        errors: validationResult.error.deatils.map((detail) => detail.message),
      });
      const message = validateResult.error.deatils.map(
        (detail) => detail.message
      );
      throw new ValidatorError(message);
    }

    if (isParam) {
      req.params = validateResult.value;
    } else if (isQuery) {
      req.query = validateRequest.value;
    } else {
      req.body = validateResult.value;
    }
    next();
  };
}

module.exports = { validateRequest };
