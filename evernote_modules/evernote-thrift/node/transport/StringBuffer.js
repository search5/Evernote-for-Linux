function TextBuffer(buffer) {
  'use strict';
  this.queue = [];
  this.buffer = buffer;
  this.offset = 0;
}

TextBuffer.prototype.read = function(len) {
  'use strict';
  this.flush();
  var view = this.buffer.slice(this.offset, this.offset + len);
  this.offset += len;
  return view;
};

TextBuffer.prototype.readAll = function() {
  'use strict';
  this.flush();
  var remainingLen = this.buffer.length - this.offset;
  return this.read(remainingLen);
};

TextBuffer.prototype.write = function(str) {
  'use strict';
  this.queue.push(str);
};

TextBuffer.prototype.clear = function() {
  'use strict';
  this.queue = [];
  this.buffer = null;
  this.offset = 0;
};

TextBuffer.prototype.flush = function() {
  'use strict';
  var result = this.buffer ? this.buffer : '';

  result += this.queue.join('');
  this.queue = [];
  this.buffer = result;
};

module.exports = TextBuffer;
