var MemBuffer = require('./NodeMemBuffer');
var Exceptions = require('./Exceptions');
var http = require('http');
var https = require('https');
var url = require('url');

function BinaryHttpTransport(serviceUrl, quiet, insecure, additionalHeaders, agent) {
  'use strict';
  var parsedUrl = url.parse(serviceUrl);
  this.hostname = parsedUrl.hostname;
  this.port = parsedUrl.port;
  this.path = parsedUrl.path;
  this.url = parsedUrl.href;
  this.quiet = !!quiet;
  this.insecure = !!insecure;
  this.additionalHeaders = additionalHeaders;
  this.agent = agent;
  this.input = new MemBuffer();
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
  var self = this;
  var headers = Object.assign({
    'Content-Type': 'application/x-thrift',
    'Accept': 'application/x-thrift'
  }, this.additionalHeaders);
  var options = {
    hostname: this.hostname,
    port: this.port,
    path: this.path,
    method: 'POST',
    headers: headers,
  };
  if (this.agent) {
    options.agent = this.agent;
  }
  var url = this.url;
  var req = (this.insecure ? http : https).request(options, function(res) {
    var chunksArray = [];
    if (res.statusCode !== 200) {
      var msg = 'Error in Thrift response. status:' + res.statusCode + 'headers: ' + JSON.stringify(res.headers);
      self.log(msg);
      if (callback) {
        callback(new Exceptions.TransportException(msg,
            new Exceptions.HTTPException('', url, res.statusCode, res.headers)));
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
    self.log('Error making Thrift HTTP request: ' + err);
    if (callback) {
      callback(new Exceptions.TransportException(
          err.message ? err.message: 'Thrift request failed',
          new Exceptions.NetworkException(JSON.stringify(err), url)));
    }
  });

  this.input.flush();
  req.write(this.input.buffer);
  req.end();
  this.clear();
};

BinaryHttpTransport.prototype.log = function(msg) {
  'use strict';
  if (this.quiet) {
    return;
  }
  console.log(msg);
};

module.exports = BinaryHttpTransport;
