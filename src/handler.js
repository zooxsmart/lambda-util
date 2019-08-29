const debug = require('debug')('lambda-util');
const response = require('./response');
const hal = require('./hal');
const errors = require('./errors');

class Handler {
  /**
   * @param {{
   *    fetch: function,
   *    fetchAll: function,
   *    countAll: function,
   *    create: function,
   *    update: function,
   *    delete: function
   * }} mapper
   * @param {{useHal: boolean}} config
   */
  constructor(mapper, config = {}) {
    this.mapper = mapper;
    this.config = {
      useHal: true,
      ...config,
    };
  }

  /**
   * @param {{path: string, pathParameters: Object, queryStringParameters: Object}} event
   * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
   * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
   */
  async getEntity(event, context) {
    // eslint-disable-next-line no-param-reassign
    context.callbackWaitsForEmptyEventLoop = false;

    let entity;
    try {
      entity = await this.mapper.fetch(event.pathParameters.id, event.queryStringParameters || {});
    } catch (err) {
      return Handler.handleError(err);
    }

    if (!this.config.useHal) {
      return response.createResponse(200, entity);
    }

    const resource = hal.toHal(entity.toJSON(), event.path);

    return response.createResponse(200, resource.toJSON());
  }

  /**
   * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
   * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
   * @param {String} collectionName
   * @param {String} entityUrlBase
   * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
   */
  async getCollection(event, context, collectionName = null, entityUrlBase = null) {
    // eslint-disable-next-line no-param-reassign
    context.callbackWaitsForEmptyEventLoop = false;

    const query = typeof event.queryStringParameters === 'object' && event.queryStringParameters !== null
      ? event.queryStringParameters
      : {};

    let result;
    let count;
    try {
      result = await this.mapper.fetchAll(query);
      if (query.total && query.total === '1') {
        count = await this.mapper.countAll(query);
      }
    } catch (err) {
      return Handler.handleError(err);
    }

    if (!this.config.useHal) {
      return response.createResponse(200, result);
    }

    const resource = hal.toHalCollection(result, collectionName, event.path, entityUrlBase, query, count);

    return response.createResponse(200, resource.toJSON());
  }

  /**
   * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
   * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
   * @param {String} entityUrlBase
   * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
   */
  async createEntity(event, context, entityUrlBase = null) {
    // eslint-disable-next-line no-param-reassign
    context.callbackWaitsForEmptyEventLoop = false;

    let { body } = event;

    if (body === null) {
      throw new errors.BadRequest('Body must not be empty');
    }

    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    let entity;
    try {
      entity = await this.mapper.create(body);
    } catch (err) {
      return Handler.handleError(err);
    }

    if (!this.config.useHal) {
      return response.createResponse(200, entity);
    }

    const resource = hal.toHal(entity.toJSON(), entityUrlBase + entity.id);

    return response.createResponse(201, resource.toJSON());
  }

  /**
   * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
   * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
   * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
   */
  async updateEntity(event, context) {
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
      throw new errors.BadRequest('Body must not be empty');
    }

    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    let entity;
    try {
      entity = await this.mapper.update(id, body);
    } catch (err) {
      return Handler.handleError(err);
    }

    if (!this.config.useHal) {
      return response.createResponse(200, entity);
    }

    const resource = hal.toHal(entity.toJSON(), event.path);

    return response.createResponse(200, resource.toJSON());
  }

  /**
   * @param {{path: string, httpMethod: string, pathParameters: Object, queryStringParameters: Object}} event
   * @param {{callbackWaitsForEmptyEventLoop: boolean}} context
   * @returns {Promise<{headers: {'Content-Type': string}, body: *, statusCode: *}>}
   */
  async deleteEntity(event, context) {
    // eslint-disable-next-line no-param-reassign
    context.callbackWaitsForEmptyEventLoop = false;

    try {
      await this.mapper.delete(event.pathParameters.id, event.queryStringParameters || {});
    } catch (err) {
      return Handler.handleError(err);
    }

    return response.createResponse(204);
  }

  static handleError(err) {
    if (err instanceof errors.ApiError) {
      return response.createErrorResponse(err.status, err.detail);
    }

    debug(err);
    return response.createErrorResponse(500);
  }
}

module.exports = Handler;
