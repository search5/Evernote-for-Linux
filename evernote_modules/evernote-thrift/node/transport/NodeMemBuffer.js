function MemBuffer(buffer) {
  'use strict';
  this.queue = [];
  this.offset = 0;
  this.buffer = buffer;
}

MemBuffer.prototype.read = function(len) {
  'use strict';
  if (this.offset + len > this.buffer.length) {
    throw Error('MemBuffer overrun');
  }
  // console.log('MemBuffer.read len: ' + len + ' buffer.length: ' + this.buffer.length + ' offset: ' + this.offset);
  var buffer = this.buffer.slice(this.offset, this.offset + len);
  this.offset += len;
  return buffer;
};

MemBuffer.prototype.write = function(buffer) {
  'use strict';
  if (Buffer.isBuffer(buffer)) {
    this.queue.push(buffer);
  } else if (buffer.buffer && buffer.buffer instanceof ArrayBuffer) {
    this.queue.push(Buffer.from(buffer.buffer));
  } else {
    throw Error('Unsupported type sent to MemBuffer.write. Accepts Buffer and ArrayBuffer.');
  }
};

MemBuffer.prototype.clear = function() {
  'use strict';
  this.queue = [];
  this.buffer = null;
  this.offset = 0;
};

MemBuffer.prototype.flush = function() {
  'use strict';
  if (this.buffer) {
    this.queue.unshift(this.buffer);
  }
  this.buffer = Buffer.concat(this.queue);
  this.queue = [];
};

module.exports = MemBuffer;
