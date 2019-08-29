const ApiError = require('./api-error');

class ConflictError extends ApiError {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.status = 409;
    this.detail = JSON.parse(message);
  }
}

module.exports = ConflictError;
