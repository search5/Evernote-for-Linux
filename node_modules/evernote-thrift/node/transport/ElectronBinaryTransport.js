var MemBuffer = require('./NodeMemBuffer');
var electron = require('electron');
var Exceptions = require('./Exceptions');

/**
 * Transport class for Electron Main process using
 * net module to communicate with thrift APIs.
 * serviceUrl: Absolute url with protocol and path.
 * quiet: If false, errors will be logged to console. Only for debugging.
 * headers: Any additional headers in a Map with header name as key and value as value.
 */
function ElectronBinaryTransport(serviceUrl, quiet, headers) {
  'use strict';

  this.serviceUrl = serviceUrl;
  this.quiet = !!quiet;
  this.headers = headers;
  this.input = new MemBuffer();
}

ElectronBinaryTransport.prototype.open = function() {
  'use strict';
};

ElectronBinaryTransport.prototype.close = function() {
  'use strict';
};

ElectronBinaryTransport.prototype.read = function() {
  'use strict';
  throw Error('ElectronBinaryTransport object does not support reads');
};

ElectronBinaryTransport.prototype.write = function(bytes) {
  'use strict';
  this.input.write(bytes);
};

ElectronBinaryTransport.prototype.clear = function() {
  'use strict';
  this.input.clear();
};

ElectronBinaryTransport.prototype.flush = function(callback) {
  'use strict';
  if (electron.net === undefined) {
    throw Error('Electron net can only be used after app ready.')
  }
  var self = this;
  var req = electron.net.request({url: this.serviceUrl, protocol: 'https:', method: 'POST'});
  req.setHeader('Content-type', 'application/x-thrift');
  req.setHeader('Accept', 'application/x-thrift');
  if (this.headers) {
    this.headers.forEach(function(value, key) {
      req.setHeader(key, value);
    });
  }

  var url = this.serviceUrl;
  req.on('response', function(res) {
    var chunksArray = [];
    if (res.statusCode !== 200) {
      var msg = 'Error in Thrift response. status:' + res.statusCode + 'headers: ' + JSON.stringify(res.headers);
      self.log(msg);
      if (callback) {
        callback(new Exceptions.TransportException(msg,
            new Exceptions.HTTPException('', url, res.statusCode)));
        return;
      }
    }

    res.on('data', function(chunk) {
      chunksArray.push(chunk);
    });

    res.on('end', function() {
      var buffer = Buffer.concat(chunksArray);
      if (callback) {
        callback(null, new MemBuffer(buffer));
      }
    });
  });

  req.on('error', function(err) {
    self.log('Error making Thrift request:' + err);
    if (callback) {
      callback(new Exceptions.TransportException(
          err.message ? err.message: 'Thrift request failed',
          new Exceptions.NetworkException(JSON.stringify(err), url)));
    }
  });

  this.input.flush();
  req.end(this.input.buffer);
  this.clear();
};

ElectronBinaryTransport.prototype.log = function(msg) {
  'use strict';
  if (this.quiet) {
    return;
  }
  console.log(msg);
};

module.exports = ElectronBinaryTransport;
