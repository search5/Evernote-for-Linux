/* global ActiveXObject:true */
var MemBuffer = require('./StringBuffer');

function TextHttpTransport(url, opts) {
  'use strict';
  this.input = new MemBuffer();
  this.url = url;
  this.opts = opts || {};
}

TextHttpTransport.prototype.open = function() {
  'use strict';
};

TextHttpTransport.prototype.close = function() {
  'use strict';
};

TextHttpTransport.prototype.read = function(len) {
  'use strict';
  throw Error('TextHttpTransport object does not support reads');
};

TextHttpTransport.prototype.write = function(bytes) {
  'use strict';
  this.input.write(bytes);
};

TextHttpTransport.prototype.clear = function() {
  'use strict';
  this.input.clear();
};

var getXmlHttpRequestObject = function() {
  'use strict';
  try {
    return new XMLHttpRequest();
  } catch (e1) {
    // ignore
  }

  try {
    return new ActiveXObject('Msxml2.XMLHTTP');
  } catch (e2) {
    // ignore
  }

  try {
    return new ActiveXObject('Microsoft.XMLHTTP');
  } catch (e3) {
    // ignore
  }

  throw Error('Your browser doesn\'t support the XmlHttpRequest object.');
};

TextHttpTransport.prototype.flush = function(callback) {
  'use strict';
  var xhr;

  xhr = getXmlHttpRequestObject();
  if (xhr.overrideMimeType) {
    xhr.overrideMimeType('application/json');
  }

  xhr.open('POST', this.url, /* async */true);
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
