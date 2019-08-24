const response = require('./src/response');
const uuid = require('./src/uuid');
const hal = require('./src/hal');
const configClient = require('./src/configClient');
const handlers = require('./src/handlers');
const errors = require('./src/errors');

// noinspection JSUnusedGlobalSymbols
module.exports = {
  response,
  uuid,
  handlers,
  hal,
  configClient,
  errors,
};
