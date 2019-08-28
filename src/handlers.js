const debug = require('debug')('lambda-mysql');
const response = require('./response');
const hal = require('./hal');
const {
  BadRequest, ValidationError, NotFound, ConflictError,
} = require('./errors');

/**
 * @param {{path: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {{fetch: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function getEntity(event, context, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  let entity;
  try {
    entity = await mapper.fetch(event.pathParameters.id, event.queryStringParameters || {});
  } catch (err) {
    if (err instanceof NotFound) {
      return response.createErrorResponse(404);
    }
    debug(err);
    return response.createErrorResponse(500);
  }

  const resource = hal.toHal(entity.toJSON(), event.path);

  return response.createResponse(200, resource.toJSON());
}

/**
 * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {String} collectionName
 * @param {String} entityUrlBase
 * @param {{fetchAll: function, countAll: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function getCollection(event, context, collectionName, entityUrlBase, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  const query = typeof event.queryStringParameters === 'object' && event.queryStringParameters !== null
    ? event.queryStringParameters
    : {};

  let result;
  let count;
  try {
    result = await mapper.fetchAll(query);
    if (query.total && query.total === '1') {
      count = await mapper.countAll(query);
    }
  } catch (err) {
    if (err instanceof BadRequest) {
      return response.createErrorResponse(400, err.message);
    }
    debug(err);
    return response.createErrorResponse(500);
  }

  // result.map(entity => model.fromData(entity, false));

  const resource = hal.toHalCollection(result, collectionName, event.path, entityUrlBase, query, count);

  return response.createResponse(200, resource.toJSON());
}

/**
 * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {String} entityUrlBase
 * @param {{fetch: function, save: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function createEntity(event, context, entityUrlBase, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  let { body } = event;

  if (body === null) {
    throw new BadRequest('Body must not be empty');
  }

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let entity;
  try {
    entity = await mapper.create(body);
  } catch (err) {
    if (err instanceof BadRequest) {
      return response.createErrorResponse(400, err.message);
    }
    if (err instanceof ValidationError) {
      return response.createErrorResponse(422, JSON.parse(err.message));
    }
    if (err instanceof ConflictError) {
      return response.createErrorResponse(409, JSON.parse(err.message));
    }
    if (err instanceof NotFound) {
      return response.createErrorResponse(404);
    }

    debug(err);
    return response.createErrorResponse(500);
  }

  const resource = hal.toHal(entity.toJSON(), entityUrlBase + entity.id);

  return response.createResponse(201, resource.toJSON());
}

/**
 * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {{fetch: function, save: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function updateEntity(event, context, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  let id = null;
  if (event.pathParameters !== null && typeof event.pathParameters === 'object') {
    id = event.pathParameters.id || null;
  }

  if (id === null) {
    return response.createErrorResponse(400, 'No id provided');
  }

  let { body } = event;

  if (body === null) {
    throw new BadRequest('Body must not be empty');
  }

  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  let entity;
  try {
    entity = await mapper.update(id, body);
  } catch (err) {
    if (err instanceof BadRequest) {
      return response.createErrorResponse(400, err.message);
    }
    if (err instanceof ValidationError) {
      return response.createErrorResponse(422, JSON.parse(err.message));
    }
    if (err instanceof ConflictError) {
      return response.createErrorResponse(409, JSON.parse(err.message));
    }
    if (err instanceof NotFound) {
      return response.createErrorResponse(404);
    }

    debug(err);
    return response.createErrorResponse(500);
  }

  const resource = hal.toHal(entity.toJSON(), event.path);

  return response.createResponse(200, resource.toJSON());
}

/**
 * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
 * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
 * @param {{fetch: function, delete: function}} mapper
 * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
 */
async function deleteEntity(event, context, mapper) {
  // eslint-disable-next-line no-param-reassign
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await mapper.delete(event.pathParameters.id, event.queryStringParameters || {});
  } catch (err) {
    if (err instanceof NotFound) {
      return response.createErrorResponse(404);
    }
    debug(err);
    return response.createErrorResponse(500);
  }

  return response.createResponse(204);
}

// noinspection JSUnusedGlobalSymbols
module.exports = {
  getEntity,
  getCollection,
  createEntity,
  updateEntity,
  deleteEntity,
};
