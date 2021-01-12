var MemBuffer = require('./MemBuffer');

var Transport = function(notify) {
  'use strict';
  this.notify = notify;
  this.received = new MemBuffer();
  this.input = new MemBuffer();
};

(function(p) {
  'use strict';
  p.reset = function() {
    this.received.clear();
    this.input.clear();
  };

  p.open = function() {
  };

  p.close = function() {
  };

  p.read = function(len) {
    return this.received.read(len);
  };
  p.readAll = function() {
    return this.received.buffer;
  };
  p.write = function(bytes) {
    this.input.write(bytes);
  };

  p.flush = function(async) {
    this.input.flush();
    /* Build the string manually rather than calling String.fromCharCode.apply to
     * prevent RangeError issues - see
     * https://github.com/manuels/texlive.js/issues/18. */
    var buffer = this.input.buffer;
    var bufferLength = buffer.length;
    var chars = [];
    for (var i = 0; i < bufferLength; i++) {
      chars.push(String.fromCharCode(buffer[i]));
    }
    this.notify(window.btoa(chars.join('')));
    this.reset();
  };

  p.send = function(client, postData, args, recvMethod) {
  };

  p.receive = function(base64) {
    var binaryString = window.atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    this.received = new MemBuffer(bytes.buffer);
  };
}(Transport.prototype));

module.exports = Transport;
