/* eslint-disable no-param-reassign */
const hal = require('hal');
const queryString = require('query-string');

function toHal(entity, route, ordered = false) {
  if (!ordered) {
    return new hal.Resource(entity, route);
  }

  const orderedEntity = {};
  Object.keys(entity)
    .sort()
    .forEach((key) => {
      orderedEntity[key] = entity[key];
    });
  return new hal.Resource(orderedEntity, route);
}

function toHalCollection(list, collectionName, collectionUrl, entityUrlBase, query, totalItems) {
  const entities = [];

  list.forEach((entity) => {
    entities.push(toHal(entity, entityUrlBase + entity.id));
  });

  const page = parseInt(query.page || 1, 10);

  const collectionObject = {
    page,
    page_size: parseInt(query.limit || 25, 10),
    count: entities.length,
  };

  if (totalItems) {
    collectionObject.total_items = totalItems;
    collectionObject.page_count = Math.ceil(totalItems / collectionObject.count);
  }

  const collection = new hal.Resource(collectionObject, `${collectionUrl}?${queryString.stringify(query)}`);

  if (page > 2) {
    query.page = 1;
    collection.link('first', `${collectionUrl}?${queryString.stringify(query)}`);
  }
  if (page > 1) {
    query.page = page - 1;
    collection.link('prev', `${collectionUrl}?${queryString.stringify(query)}`);
  }

  if (collectionObject.count > 0) {
    query.page = page + 1;
    collection.link('next', `${collectionUrl}?${queryString.stringify(query)}`);
  }

  if (totalItems && page < collectionObject.page_count - 1) {
    query.page = collectionObject.page_count;
    collection.link('last', `${collectionUrl}?${queryString.stringify(query)}`);
  }

  collection.embed(collectionName, entities, false);

  return collection;
}

module.exports = {
  toHal,
  toHalCollection,
};
