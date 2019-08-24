/* eslint-disable import/no-extraneous-dependencies,no-param-reassign */
const { promisify } = require('util');
const EventEmitter = require('events');
const AWS = require('aws-sdk');
const debug = require('debug')('lambda-util');

const ssm = new AWS.SSM();
// noinspection JSValidateTypes
ssm.getParameters = promisify(ssm.getParameters);
const DEFAULT_EXPIRY = 5 * 60 * 1000; // default expiry is 5 mins

const cache = {
  expiration: new Date(0),
  items: {},
};

function loadConfigs(keys, expiryMs) {
  expiryMs = expiryMs || DEFAULT_EXPIRY;

  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    throw new Error('You need to provide a non-empty array of config keys');
  }

  if (expiryMs <= 0) {
    throw new Error('You need to specify an expiry (ms) greater than 0, or leave it undefined');
  }

  const eventEmitter = new EventEmitter();

  const validate = (keys2, params) => {
    const missing = keys2.filter((k) => params[k] === undefined);
    if (missing.length > 0) {
      throw new Error(`Missing keys: ${missing}`);
    }
  };

  const reload = async () => {
    debug(`Loading cache keys: ${keys}`);

    const req = {
      Names: keys,
      WithDecryption: true,
    };
    const resp = await ssm.getParameters(req);

    const params = {};
    resp.Parameters.forEach((p) => {
      params[p.Name] = p.Value;
    });

    validate(keys, params);

    debug(`Successfully loaded cache keys: ${keys}`);
    const now = new Date();

    cache.expiration = new Date(now.getTime() + expiryMs);
    cache.items = params;

    eventEmitter.emit('refresh');
  };

  const getValue = async (key) => {
    const now = new Date();
    if (now <= cache.expiration) {
      return cache.items[key];
    }

    try {
      await reload();
      return cache.items[key];
    } catch (err) {
      if (cache.items && cache.items.length > 0) {
        // swallow exception if cache is stale, as we'll just try again next time
        debug('[WARN] Error from SSM Parameter Store:\n', err);

        eventEmitter.emit('refreshError', err);

        return cache.items[key];
      }

      debug(`[ERROR] Couldn't fetch the initial configs : ${keys}`);
      debug(err);

      throw err;
    }
  };

  // noinspection JSUnusedGlobalSymbols
  const config = {
    onRefresh: (listener) => eventEmitter.addListener('refresh', listener),
    onRefreshError: (listener) => eventEmitter.addListener('refreshError', listener),
  };
  keys.forEach((key) => {
    Object.defineProperty(config, key, {
      get() {
        return getValue(key);
      },
      enumerable: true,
      configurable: false,
    });
  });

  return config;
}

// noinspection JSUnusedGlobalSymbols
module.exports = {
  loadConfigs,
};
