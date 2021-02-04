function TransportException(message, cause) {
  this.message = message;
  this.cause = cause;
}

TransportException.prototype = Object.create(Error.prototype);
TransportException.prototype.name = 'TransportException';

function HTTPException(message, url, statusCode, headers) {
  this.message = message;
  this.url = url;
  this.statusCode = statusCode;
  this.headers = headers;
}

HTTPException.prototype = Object.create(Error.prototype);
HTTPException.prototype.name = 'HTTPException';

function NetworkException(message, url) {
  this.message = message;
  this.url = url;
}

NetworkException.prototype = Object.create(Error.prototype);
NetworkException.prototype.name = 'NetworkException';

module.exports = {
  TransportException: TransportException,
  HTTPException: HTTPException,
  NetworkException: NetworkException
};
