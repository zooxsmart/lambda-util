/* eslint-disable no-param-reassign */
const has = require('lodash.has');
const { uuid } = require('../uuid');
const { BadRequest } = require('../errors');

module.exports = (incomingOptions) => {
  const options = {
    idColumn: 'id',
    idGenerator: uuid.v4,
    ...incomingOptions,
  };

  return (Mapper) => class extends Mapper {
    beforeCreate(select, data) {
      super.beforeCreate(select, data);

      if (!has(data, 'id')) {
        data.id = options.idGenerator();
      }
    }

    beforeUpdate(select, id, data) {
      super.beforeUpdate(select, id, data);

      if (has(data, 'id')) {
        throw new BadRequest('Id property cannot be updated');
      }
    }
  };
};
