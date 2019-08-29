const ApiError = require('./api-error');

class BadRequest extends ApiError {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.status = 400;
    this.detail = message;
  }
}

module.exports = BadRequest;
