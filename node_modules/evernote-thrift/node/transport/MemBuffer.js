function MemBuffer(buffer) {
  'use strict';
  this.queue = [];
  this.buffer = buffer;
  this.offset = 0;
}

MemBuffer.prototype.read = function(len) {
  'use strict';
  var view = new DataView(this.buffer, this.offset, len);
  this.offset += len;
  return view;
};

MemBuffer.prototype.write = function(bytes) {
  'use strict';
  var u8;
  if (bytes.buffer) {
    u8 = bytes instanceof Uint8Array
      ? bytes
      : new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  } else {
    u8 = new Uint8Array(bytes);
  }
  this.queue.push(u8);
};

MemBuffer.prototype.clear = function() {
  'use strict';
  this.queue = [];
  this.buffer = null;
  this.offset = 0;
};

MemBuffer.prototype.flush = function() {
  'use strict';
  var size = 0;
  var pos = 0;
  var result;

  if (this.buffer) {
    size = this.buffer.byteLength;
  }
  size = this.queue.reduce(function(innerSize, bytes) {
    return innerSize + bytes.byteLength;
  }, size);
  result = new Uint8Array(new ArrayBuffer(size));

  if (this.buffer) {
    result.set(this.buffer);
  }
  this.queue.forEach(function(bytes) {
    result.set(bytes, pos);
    pos += bytes.byteLength;
  });

  this.queue = [];
  this.buffer = result;
};

module.exports = MemBuffer;
