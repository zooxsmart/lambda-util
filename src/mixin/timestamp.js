/* eslint-disable no-param-reassign */
const dateFormat = require('dateformat');
const has = require('lodash.has');

module.exports = (incomingOptions) => {
  const options = {
    createdAtColumn: 'createdAt',
    updatedAtColumn: 'updatedAt',
    dateMask: 'isoUtcDateTime',
    ...incomingOptions,
  };

  return (Mapper) => class extends Mapper {
    beforeCreate(select, data) {
      super.beforeCreate(select, data);

      if (options.createdAtColumn !== null && !has(data, options.createdAtColumn)) {
        data[options.createdAtColumn] = dateFormat(new Date(), options.dateMask);
      }
      if (options.updatedAtColumn !== null && !has(data, options.updatedAtColumn)) {
        data[options.updatedAtColumn] = dateFormat(new Date(), options.dateMask);
      }
    }

    beforeUpdate(select, id, data) {
      super.beforeUpdate(select, id, data);

      if (options.updatedAtColumn !== null && !has(data, options.updatedAtColumn)) {
        data[options.updatedAtColumn] = dateFormat(new Date(), options.dateMask);
      }
    }
  };
};
