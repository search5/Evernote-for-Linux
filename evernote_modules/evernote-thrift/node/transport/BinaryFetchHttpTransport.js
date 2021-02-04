var Exceptions = require('./Exceptions');
var MemBuffer = require('./MemBuffer');

function BinaryFetchHttpTransport(url, opts) {
  'use strict';
  this.input = new MemBuffer();
  this.url = url;
  this.opts = opts || {};
}

BinaryFetchHttpTransport.prototype.open = function() {
};

BinaryFetchHttpTransport.prototype.close = function() {
};

BinaryFetchHttpTransport.prototype.read = function(len) {
  throw Error('BinaryFetchHttpTransport object does not support reads');
};

BinaryFetchHttpTransport.prototype.write = function(bytes) {
  this.input.write(bytes);
};

BinaryFetchHttpTransport.prototype.clear = function() {
  this.input.clear();
};

BinaryFetchHttpTransport.prototype.flush = function(callback) {
  const mimeType = 'application/x-thrift'
  var headers = {
    'Content-Type': mimeType,
    'Accept': mimeType,
  };
  if (this.opts.headers) {
    for (var name in this.opts.headers) {
      headers[name] = this.opts.headers[name];
    }
  }
  this.input.flush();

  // Wrap payload in a Blob object in order to handle large payloads and prevent browser crashing.
  const body = new Blob([this.input.buffer], {type: mimeType});

  fetch(this.url, {
    method: 'post',
    headers,
    body,
    credentials: this.opts.noCredentials ? 'omit' : 'include',
  }).then(async response => {
    if (callback) {
      if (response.status === 200) {
        response.arrayBuffer().then(aBuf => {
          callback(null, new MemBuffer(aBuf));
        }).catch(err => {
          callback(new Exceptions.TransportException('Fetch response handling error',
            new Exceptions.NetworkException(`Fetch response to arrayBuffer error ${JSON.stringify(err)} `, this.url)));
        });
      } else {
        const headers = {};
        for(let entry of response.headers.entries()) {
          if (Array.isArray(entry) && entry.length && entry.length === 2) {
            headers[entry[0]] = entry[1];
          }
        }
        callback(new Exceptions.TransportException('Non 200 http response',
          new Exceptions.HTTPException('Non 200 http response', this.url, response.status, headers)));
      }
    }
  }).catch(err => {
    if (callback) {
      callback(new Exceptions.TransportException('Fetch error',
        new Exceptions.NetworkException(`Fetch error ${JSON.stringify(err)} `, this.url)));
    }
  });
  this.clear();
};

module.exports = BinaryFetchHttpTransport;
