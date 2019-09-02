const ApiError = require('./api-error');

class Unauthorized extends ApiError {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.status = 401;
    this.detail = message;
  }
}

module.exports = Unauthorized;
