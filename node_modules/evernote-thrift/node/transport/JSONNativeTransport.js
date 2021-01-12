var Transport = function(notify) {
  'use strict';
  this.notify = notify;
  this.received = '';
  this.pos = 0;
};

(function(p) {
  'use strict';
  p.reset = function() {
    this.received = '';
    this.pos = 0;
  };

  p.open = function() {
  };

  p.close = function() {
  };

  p.read = function(len) {
    var d = this.received.substring(this.pos, this.pos + len);
    this.pos += len;
    return d;
  };
  p.readAll = function() {
    return this.received;
  };
  p.write = function(json) {
    this.notify(JSON.stringify(json));
  };

  p.flush = function(async) {
  };

  p.send = function(client, postData, args, recvMethod) {
  };

  p.receive = function(s) {
    this.received = s;
    this.pos = 0;
  };
}(Transport.prototype));

module.exports = Transport;
