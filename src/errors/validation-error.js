const ApiError = require('./api-error');

class ValidationError extends ApiError {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.status = 422;
    this.detail = JSON.parse(message);
  }
}

module.exports = ValidationError;
