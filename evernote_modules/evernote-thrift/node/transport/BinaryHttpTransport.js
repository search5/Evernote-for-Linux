var MemBuffer = require('./MemBuffer');

function BinaryHttpTransport(url, opts) {
  'use strict';
  this.input = new MemBuffer();
  this.url = url;
  this.opts = opts || {};
}

BinaryHttpTransport.prototype.open = function() {
  'use strict';
};

BinaryHttpTransport.prototype.close = function() {
  'use strict';
};

BinaryHttpTransport.prototype.read = function(len) {
  'use strict';
  throw Error('BinaryHttpTransport object does not support reads');
};

BinaryHttpTransport.prototype.write = function(bytes) {
  'use strict';
  this.input.write(bytes);
};

BinaryHttpTransport.prototype.clear = function() {
  'use strict';
  this.input.clear();
};

BinaryHttpTransport.prototype.flush = function(callback) {
  'use strict';
  var xhr;

  xhr = new XMLHttpRequest();
  xhr.open('POST', this.url, /* async */true);
  xhr.withCredentials = !this.opts.noCredentials;
  xhr.setRequestHeader('Content-Type', 'application/x-thrift');
  xhr.setRequestHeader('Accept', 'application/x-thrift');
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(evt) {
    if (callback) {
      callback(null, new MemBuffer(xhr.response));
    }
  };

  xhr.onerror = function(evt) {
    if (callback) {
      callback(evt);
    }
  };

  this.input.flush();
  /**
   * Older browsers (CEF 1 in the win-client) XHR don't support send(ArrayBufferView)
   * so we use the older, more widely supported send(ArrayBuffer).
   *
   * this usecase used to be deprecated, but is no longer:
   * https://www.w3.org/Bugs/Public/show_bug.cgi?id=26153#c1
   */
  xhr.send(this.input.buffer.buffer);
  this.clear();
};

module.exports = BinaryHttpTransport;
