const status = require('http-status');

function createResponse(statusCode, body, stringify = true) {
  let parsedBody = body;
  if (typeof parsedBody !== 'string' && stringify) {
    parsedBody = JSON.stringify(parsedBody);
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: parsedBody,
  };
}

function createErrorResponse(statusCode, message, stringify = true) {
  return createResponse(
    statusCode,
    {
      type: `https://httpstatuses.com/${statusCode}`,
      title: status[statusCode],
      code: statusCode,
      detail: message || status[statusCode],
    },
    stringify,
  );
}

module.exports = {
  createResponse,
  createErrorResponse,
};
