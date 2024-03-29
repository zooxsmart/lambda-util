const ApiError = require('./api-error');

class NotFound extends ApiError {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.status = 404;
    this.detail = message;
  }
}

module.exports = NotFound;
