var Exceptions = require('./Exceptions');
var MemBuffer = require('./MemBuffer');

function BinaryHttpTransport(url, opts) {
  this.input = new MemBuffer();
  this.url = url;
  this.opts = opts || {};
}

BinaryHttpTransport.prototype.open = function() {
};

BinaryHttpTransport.prototype.close = function() {
};

BinaryHttpTransport.prototype.read = function(len) {
  throw Error('BinaryHttpTransport object does not support reads');
};

BinaryHttpTransport.prototype.write = function(bytes) {
  this.input.write(bytes);
};

BinaryHttpTransport.prototype.clear = function() {
  this.input.clear();
};

BinaryHttpTransport.prototype.flush = function(callback) {
  var xhr;

  xhr = new XMLHttpRequest();
  xhr.open('POST', this.url, /* async */ true);
  xhr.withCredentials = !this.opts.noCredentials;
  xhr.setRequestHeader('Content-Type', 'application/x-thrift');
  xhr.setRequestHeader('Accept', 'application/x-thrift');
  xhr.responseType = 'arraybuffer';

  var headers = this.opts.headers || {};
  for (var name in headers) {
    var value = headers[name];
    xhr.setRequestHeader(name, value);
  }

  var url = this.url;

  xhr.onload = function(evt) {
    if (callback) {
      if (xhr.status === 200) {
        callback(null, new MemBuffer(xhr.response));
      } else {
        const rawHeaders = xhr.getAllResponseHeaders();
        const rawHeadersArr = rawHeaders.trim().split(/[\r\n]+/);
        const headers = {};
        rawHeadersArr.forEach(function (line) {
          var parts = line.split(': ');
          var header = parts.shift();
          var value = parts.join(': ');
          headers[header] = value;
        });
        callback(new Exceptions.TransportException(
          'Non 200 http response',
          new Exceptions.HTTPException('Non 200 http response', url, xhr.status, headers)));
      }
    }
  };

  xhr.onerror = function(evt) {
    if (callback) {
      callback(new Exceptions.TransportException(
        'XHR error event', new Exceptions.NetworkException('XHR error event', url)));
    }
  };

  // sometimes react native emits timeout instead error on network exceptions.
  xhr.ontimeout = function (evt) {
    if (callback) {
      callback(new Exceptions.TransportException(
        'XHR error event. Timeout.', new Exceptions.NetworkException('XHR error event. Timeout.', url)));
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
