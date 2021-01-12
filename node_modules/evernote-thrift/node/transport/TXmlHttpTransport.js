/* global ActiveXObject */
var MemBuffer = require('./StringBuffer');

function TextHttpTransport(url, opts) {
  this.input = new MemBuffer();
  this.url = url;
  this.opts = opts || {};
}

TextHttpTransport.prototype.open = function() {
};

TextHttpTransport.prototype.close = function() {
};

TextHttpTransport.prototype.read = function(len) {
  throw Error('TextHttpTransport object does not support reads');
};

TextHttpTransport.prototype.write = function(bytes) {
  this.input.write(bytes);
};

TextHttpTransport.prototype.clear = function() {
  this.input.clear();
};

var getXmlHttpRequestObject = function() {
  try {
    return new XMLHttpRequest();
  } catch (e1) {
    /* do nothing */
  }
  try {
    return new ActiveXObject('Msxml2.XMLHTTP');
  } catch (e2) {
    /* do nothing */
  }
  try {
    return new ActiveXObject('Microsoft.XMLHTTP');
  } catch (e3) {
    /* do nothing */
  }

  throw Error('Your browser doesn\'t support the XmlHttpRequest object.');
};

TextHttpTransport.prototype.flush = function(callback) {
  var xhr;

  xhr = getXmlHttpRequestObject();
  if (xhr.overrideMimeType) {
    xhr.overrideMimeType('application/json');
  }

  xhr.open('POST', this.url, /* async */ true);
  xhr.withCredentials = !this.opts.noCredentials;
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.responseType = 'application/json';

  /**
   * In IE8/9, the XMLHttpRequest 1 spec does not have a rich
   * set of callbacks - it only offers 'onreadystatechange'.
   */
  if (Object.prototype.hasOwnProperty.call(xhr, 'onload')
      && Object.prototype.hasOwnProperty.call(xhr, 'onerror')) {

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

  } else {

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && callback) {
        if (xhr.status === 200) {
          callback(null, new MemBuffer(xhr.responseText));
        } else {
          callback(new Error('unexpected status: ' + xhr.status));
        }
      }
    };
  }

  this.input.flush();
  xhr.send(this.input.buffer);
  this.clear();
};

module.exports = TextHttpTransport;
