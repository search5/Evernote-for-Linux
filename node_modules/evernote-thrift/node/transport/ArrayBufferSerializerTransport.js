/**
 * A transport which captures the serialized result of a thrift call and saves
 * it.
 */
require('../thrift');

var Transport = function() {
  this.buffer = [];
  this.readOffset = 0;
};

(function(p) {
  p.reset = function() {
    this.buffer = [];
    this.readOffset = 0;
  };

  p.getBytes = function() {
    var bufferSize = this.buffer.reduce(function(size, bytes) {
      return size + bytes.byteLength;
    }, 0);

    var allbytes = new Uint8Array(new ArrayBuffer(bufferSize));
    var pos = 0;
    this.buffer.forEach(function(bytes) {
      var view = null;
      if (bytes.buffer) {
        view = (bytes instanceof Uint8Array) ? bytes : new Uint8Array(
            bytes.buffer, bytes.byteOffset, bytes.byteLength);
      } else {
        view = new Uint8Array(bytes);
      }

      allbytes.set(view, pos);
      pos += bytes.byteLength;
    });

    return allbytes;
  };

  p.open = function() {
  };

  p.close = function() {
  };

  p.read = function(len) {
    var view = new DataView(this.getBytes().buffer, this.readOffset, len);
    this.readOffset += len;
    return view;
  };

  p.write = function(bytes) {
    this.buffer.push(bytes);
  };

  p.flush = function(async) {
  };

  p.send = function(client, postData, args, recvMethod) {
  };

}(Transport.prototype));

module.exports = Transport;
