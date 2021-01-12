var BinaryParser = {};

BinaryParser.fromByte = function(b) {
  'use strict';
  var buffer = new ArrayBuffer(1);
  new DataView(buffer).setInt8(0, b);
  return buffer;
};

BinaryParser.fromShort = function(i16) {
  'use strict';
  i16 = parseInt(i16);
  var buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, i16);
  return buffer;
};

BinaryParser.fromInt = function(i32) {
  'use strict';
  i32 = parseInt(i32);
  var buffer = new ArrayBuffer(4);
  new DataView(buffer).setInt32(0, i32);
  return buffer;
};

BinaryParser.fromLong = function(n) {
  'use strict';
  n = parseInt(n);
  if (Math.abs(n) >= Math.pow(2, 53)) {
    throw new Error('Unable to accurately transfer numbers larger than 2^53 - 1 as integers. '
      + 'Number provided was ' + n);
  }

  var bits = (Array(64).join('0') + Math.abs(n).toString(2)).slice(-64);
  if (n < 0) {
    bits = this.twosCompliment(bits);
  }

  var buffer = new ArrayBuffer(8);
  var dataview = new DataView(buffer);
  for (var i = 0; i < 8; i++) {
    var uint8 = parseInt(bits.substr(8 * i, 8), 2);
    dataview.setUint8(i, uint8);
  }

  return buffer;
};

BinaryParser.twosCompliment = function(bits) {
    // Convert to two's compliment using string manipulation because bitwise operator is limited to 32 bit numbers
  'use strict';
  var smallestOne = bits.lastIndexOf('1');
  var left = bits.substring(0, smallestOne).
      replace(/1/g, 'x').
      replace(/0/g, '1').
      replace(/x/g, '0');
  bits = left + bits.substring(smallestOne);
  return bits;
};

BinaryParser.fromDouble = function(d) {
  'use strict';
  var buffer = new ArrayBuffer(8);
  new DataView(buffer).setFloat64(0, d);
  return buffer;
};

BinaryParser.fromString = function(s) {
  'use strict';
  var i;
  var utf8 = unescape(encodeURIComponent(s));
  var len = utf8.length;
  var bytes = new Uint8Array(len);

  for (i = 0; i < len; i++) {
    bytes[i] = utf8.charCodeAt(i);
  }
  return bytes.buffer;
};

BinaryParser.toByte = function(dataview) {
  'use strict';
  return dataview.getUint8(0);
};

BinaryParser.toBytes = function(dataview) {
  'use strict';
  var len = dataview.byteLength;
  var array = new Uint8Array(len);
  var i;
  for (i = 0; i < len; i++) {
    array[i] = dataview.getUint8(i);
  }
  return array;
};

BinaryParser.toShort = function(dataview) {
  'use strict';
  return dataview.getInt16(0);
};

BinaryParser.toInt = function(dataview) {
  'use strict';
  return dataview.getInt32(0);
};

BinaryParser.toLong = function(dataview) {
  // Javascript does not support 64-bit integers. Only decode values up to 2^53 - 1.
  'use strict';
  var sign = 1;
  var bits = '';
  for (var i = 0; i < 8; i++) {
    bits += (Array(8).join('0') + dataview.getUint8(i).toString(2)).slice(-8);
  }

  if (bits[0] === '1') {
    sign = -1;
    bits = this.twosCompliment(bits);
  }
  var largestOne = bits.indexOf('1');
  if (largestOne !== -1 && largestOne < 64 - 54) {
    throw new Error('Unable to receive number larger than 2^53 - 1 as an integer');
  }

  return parseInt(bits, 2) * sign;
};

BinaryParser.toDouble = function(dataview) {
  'use strict';
  return dataview.getFloat64(0);
};

BinaryParser.toString = function(dataview) {
  'use strict';
  var s = '';
  var i;
  var len = dataview.byteLength;
  var hex;

  for (i = 0; i < len; i++) {
    hex = dataview.getUint8(i).toString(16);
    if (hex.length == 1) {
      hex = '0' + hex;
    }
    s += '%' + hex;
  }

  s = decodeURIComponent(s);
  return s;
};

module.exports = BinaryParser;
