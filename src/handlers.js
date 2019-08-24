const debug = require('debug')('lambda-mysql');
const response = require('./response');
const hal = require('./hal');
const { BadRequest, ValidationError } = require('./errors');

/**
 * @param {{path: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {Object} model
 * @param {{fetch: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function getEntity(event, context, model, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  let result;
  try {
    result = await mapper.fetch(event.pathParameters.id, model, event.queryStringParameters || {});
  } catch (err) {
    debug(err);
    return response.createErrorResponse(500);
  }
  if (!result || result.length === 0) {
    return response.createErrorResponse(404);
  }

  const resource = hal.toHal(result, event.path);

  return response.createResponse(200, resource.toJSON());
}

/**
 * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {Object} model
 * @param {String} collectionName
 * @param {String} entityUrlBase
 * @param {{fetchAll: function, countAll: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function getCollection(event, context, model, collectionName, entityUrlBase, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  const query = typeof event.queryStringParameters === 'object' && event.queryStringParameters !== null
    ? event.queryStringParameters
    : {};

  let result;
  let count;
  try {
    result = await mapper.fetchAll(query, model);
    if (query.total && query.total === '1') {
      count = await mapper.countAll(query, model);
    }
  } catch (err) {
    if (err instanceof BadRequest) {
      return response.createErrorResponse(400, err.message);
    }
    debug(err);
    return response.createErrorResponse(500);
  }

  const resource = hal.toHalCollection(result, collectionName, event.path, entityUrlBase, query, count);

  return response.createResponse(200, resource.toJSON());
}

/**
 * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {Object} model
 * @param {{fetch: function, save: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function saveEntity(event, context, model, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  let result;

  if (event.httpMethod === 'PATCH') {
    result = await mapper.fetch(event.pathParameters.id, model, event.queryStringParameters || {});

    if (!result || result.length === 0) {
      return response.createErrorResponse(404);
    }
  }

  try {
    result = await mapper.save(event, context, model);
  } catch (err) {
    if (err instanceof BadRequest) {
      return response.createErrorResponse(400, err.message);
    }
    if (err instanceof ValidationError) {
      return response.createErrorResponse(422, err.data || err.message);
    }

    debug(err);
    return response.createErrorResponse(500);
  }

  if (typeof result === 'undefined') {
    return response.createErrorResponse(404);
  }

  const resource = hal.toHal(result, event.path);

  let status = 200;
  if (event.httpMethod === 'POST') {
    status = 201;
  }

  return response.createResponse(status, resource.toJSON());
}

/**
 * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {Object} model
 * @param {{fetch: function, delete: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function deleteEntity(event, context, model, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  let result;

  result = await mapper.fetch(event.pathParameters.id, model, event.queryStringParameters || {});

  if (!result || result.length === 0) {
    return response.createErrorResponse(404);
  }

  try {
    result = await mapper.delete(event.pathParameters.id, model, event.queryStringParameters || {});
  } catch (err) {
    debug(err);
    return response.createErrorResponse(500);
  }
  if (!result || result.length === 0) {
    return response.createErrorResponse(404);
  }

  return response.createResponse(204);
}

// noinspection JSUnusedGlobalSymbols
module.exports = {
  getEntity,
  getCollection,
  saveEntity,
  deleteEntity,
};
