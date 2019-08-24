const v1 = require('uuid/v1');
const v4 = require('uuid/v4');
const v5 = require('uuid/v5');

function createV4c() {
  function generateId() {
    const raw = v4();

    const now = Date.now() / 1000;
    // eslint-disable-next-line no-bitwise
    const s = now | 0;
    let number = `${s}${Math.round((now - s) * 100000)}`;

    const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
    let outNumber = '';
    for (let i = 11; i >= 0; i -= 1) {
      const pow = 16 ** i;
      const c = Math.trunc(number / pow);
      number -= c * pow;
      outNumber += digits[c];
    }

    return `${outNumber.substring(0, 8)}-${outNumber.substring(8, 12)}-${raw.substring(14)}`;
  }

  return generateId;
}

function validate(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(str);
}

// noinspection JSUnusedGlobalSymbols
module.exports = {
  v1,
  v4,
  v5,
  v4c: createV4c(),
  validate,
};
