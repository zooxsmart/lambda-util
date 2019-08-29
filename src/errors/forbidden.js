const ApiError = require('./api-error');

class Forbidden extends ApiError {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.status = 403;
    this.detail = message;
  }
}

module.exports = Forbidden;
