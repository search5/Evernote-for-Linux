/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* global jQuery:true */

var Thrift = require('../thrift');
var Type = Thrift.Type;

var Protocol = function(transport) {
  'use strict';
  this.transport = transport;
};

Protocol.Type = {};
Protocol.Type[Type.BOOL] = '"tf"';
Protocol.Type[Type.BYTE] = '"i8"';
Protocol.Type[Type.I16] = '"i16"';
Protocol.Type[Type.I32] = '"i32"';
Protocol.Type[Type.I64] = '"i64"';
Protocol.Type[Type.DOUBLE] = '"dbl"';
Protocol.Type[Type.STRUCT] = '"rec"';
Protocol.Type[Type.STRING] = '"str"';
Protocol.Type[Type.MAP] = '"map"';
Protocol.Type[Type.LIST] = '"lst"';
Protocol.Type[Type.SET] = '"set"';

Protocol.RType = {};
Protocol.RType.tf = Type.BOOL;
Protocol.RType.i8 = Type.BYTE;
Protocol.RType.i16 = Type.I16;
Protocol.RType.i32 = Type.I32;
Protocol.RType.i64 = Type.I64;
Protocol.RType.dbl = Type.DOUBLE;
Protocol.RType.rec = Type.STRUCT;
Protocol.RType.str = Type.STRING;
Protocol.RType.map = Type.MAP;
Protocol.RType.lst = Type.LIST;
Protocol.RType.set = Type.SET;

Protocol.Version = 1;

Protocol.prototype = {
  getTransport: function() {
    'use strict';
    return this.transport;
  },

  // Write functions
  writeType: function(type, value) {
    'use strict';
    switch (type) {
      case Type.BOOL:
        return this.writeBool(value);
      case Type.BYTE:
        return this.writeByte(value);
      case Type.I16:
        return this.writeI16(value);
      case Type.I32:
        return this.writeI32(value);
      case Type.I64:
        return this.writeI64(value);
      case Type.DOUBLE:
        return this.writeDouble(value);
      case Type.STRING:
        return this.writeString(value);
      case Type.BINARY:
        return this.writeBinary(value);
       // case Type.STRUCT:
       // case Type.MAP:
       // case Type.SET:
       // case Type.LIST:
      default:
        throw Error('Invalid type: ' + type);
    }
  },

  writeMessageBegin: function(name, messageType, seqid) {
    'use strict';
    this.tstack = [];
    this.tpos = [];

    this.tstack.push([Protocol.Version, '"'
        + name + '"', messageType, seqid]);
  },

  writeMessageEnd: function() {
    'use strict';
    var obj = this.tstack.pop();

    this.wobj = this.tstack.pop();
    this.wobj.push(obj);

    this.wbuf = '[' + this.wobj.join(',') + ']';

    this.transport.write(this.wbuf);
  },


  writeStructBegin: function(name) {
    'use strict';
    this.tpos.push(this.tstack.length);
    this.tstack.push({});
  },

  writeStructEnd: function() {
    'use strict';
    var p = this.tpos.pop();
    var struct = this.tstack[p];
    var str = '{';
    var first = true;
    for (var key in struct) {
      if (first) {
        first = false;
      } else {
        str += ',';
      }

      str += key + ':' + struct[key];
    }

    str += '}';
    this.tstack[p] = str;
  },

  writeFieldBegin: function(name, fieldType, fieldId) {
    'use strict';
    this.tpos.push(this.tstack.length);
    this.tstack.push({'fieldId': '"'
        + fieldId + '"', 'fieldType': Protocol.Type[fieldType]
    });
  },

  writeFieldEnd: function() {
    'use strict';
    var value = this.tstack.pop();
    var fieldInfo = this.tstack.pop();

    this.tstack[this.tstack.length - 1][fieldInfo.fieldId] = '{'
        + fieldInfo.fieldType + ':' + value + '}';
    this.tpos.pop();
  },

  writeFieldStop: function() {
    // na
    'use strict';
  },

  writeMapBegin: function(keyType, valType, size) {
    // size is invalid, we'll set it on end.
    'use strict';
    this.tpos.push(this.tstack.length);
    this.tstack.push([Protocol.Type[keyType],
          Protocol.Type[valType], 0]);
  },

  writeMapEnd: function() {
    'use strict';
    var p = this.tpos.pop();

    if (p == this.tstack.length) {
      return;
    }

    if ((this.tstack.length - p - 1) % 2 !== 0) {
      this.tstack.push('');
    }

    var size = (this.tstack.length - p - 1) / 2;

    this.tstack[p][this.tstack[p].length - 1] = size;

    var map = '}';
    var first = true;
    while (this.tstack.length > p + 1) {
      var v = this.tstack.pop();
      var k = this.tstack.pop();
      if (first) {
        first = false;
      } else {
        map = ',' + map;
      }

      if (!isNaN(k)) {
        k = '"' + k + '"'; // json "keys" need to be strings
      }
      map = k + ':' + v + map;
    }
    map = '{' + map;

    this.tstack[p].push(map);
    this.tstack[p] = '[' + this.tstack[p].join(',') + ']';
  },

  writeListBegin: function(elemType, size) {
    'use strict';
    this.tpos.push(this.tstack.length);
    this.tstack.push([Protocol.Type[elemType], size]);
  },

  writeListEnd: function() {
    'use strict';
    var p = this.tpos.pop();

    while (this.tstack.length > p + 1) {
      var tmpVal = this.tstack[p + 1];
      this.tstack.splice(p + 1, 1);
      this.tstack[p].push(tmpVal);
    }

    this.tstack[p] = '[' + this.tstack[p].join(',') + ']';
  },

  writeSetBegin: function(elemType, size) {
    'use strict';
    this.tpos.push(this.tstack.length);
    this.tstack.push([Protocol.Type[elemType], size]);
  },

  writeSetEnd: function() {
    'use strict';
    var p = this.tpos.pop();

    while (this.tstack.length > p + 1) {
      var tmpVal = this.tstack[p + 1];
      this.tstack.splice(p + 1, 1);
      this.tstack[p].push(tmpVal);
    }

    this.tstack[p] = '[' + this.tstack[p].join(',') + ']';
  },

  writeBool: function(value) {
    'use strict';
    this.tstack.push(value ? 1 : 0);
  },

  writeByte: function(i8) {
    'use strict';
    this.tstack.push(i8);
  },

  writeI16: function(i16) {
    'use strict';
    this.tstack.push(i16);
  },

  writeI32: function(i32) {
    'use strict';
    this.tstack.push(i32);
  },

  writeI64: function(i64) {
    'use strict';
    this.tstack.push(i64);
  },

  writeDouble: function(dbl) {
    'use strict';
    this.tstack.push(dbl);
  },

  writeString: function(str) {
    // We do not encode uri components for wire transfer:
    'use strict';
    if (str === null) {
      this.tstack.push(null);
    } else {
      // concat may be slower than building a byte buffer
      var escapedString = '';
      for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);      // a single double quote: "
        if (ch === '\"') {
          escapedString += '\\\"'; // write out as: \"
        } else if (ch === '\\') {    // a single backslash: \
          escapedString += '\\\\'; // write out as: \\
            /* Currently escaped forward slashes break TJSONProtocol.
             * As it stands, we can simply pass forward slashes into
             * our strings across the wire without being escaped.
             * I think this is the protocol's bug, not thrift.js
             * } else if(ch === '/') {   // a single forward slash: /
             *  escapedString += '\\/';  // write out as \/
             * }
             */
        } else if (ch === '\b') {    // a single backspace: invisible
          escapedString += '\\b';  // write out as: \b"
        } else if (ch === '\f') {    // a single formfeed: invisible
          escapedString += '\\f';  // write out as: \f"
        } else if (ch === '\n') {    // a single newline: invisible
          escapedString += '\\n';  // write out as: \n"
        } else if (ch === '\r') {    // a single return: invisible
          escapedString += '\\r';  // write out as: \r"
        } else if (ch === '\t') {    // a single tab: invisible
          escapedString += '\\t';  // write out as: \t"
        } else {
          escapedString += ch;     // Else it need not be escaped
        }
      }
      this.tstack.push('"' + escapedString + '"');
    }
  },

  writeBinary: function(str) {
    'use strict';
    this.writeString(str);
  },


  // Reading functions
  readType: function(type) {
    'use strict';
    var valueWrapper;
    switch (type) {
      case Type.BOOL:
        valueWrapper = this.readBool();
        break;
      case Type.BYTE:
        valueWrapper = this.readByte();
        break;
      case Type.I16:
        valueWrapper = this.readI16();
        break;
      case Type.I32:
        valueWrapper = this.readI32();
        break;
      case Type.I64:
        valueWrapper = this.readI64();
        break;
      case Type.DOUBLE:
        valueWrapper = this.readDouble();
        break;
      case Type.STRING:
        valueWrapper = this.readString();
        break;
      case Type.BINARY:
        valueWrapper = this.readBinary();
        break;
       // case Type.STRUCT:
       // case Type.MAP:
       // case Type.SET:
       // case Type.LIST:
      default:
        throw new Error('Invalid type: ' + type);
    }
    if (typeof valueWrapper === 'object') {
      return valueWrapper.value;
    }
  },

  readMessageBegin: function(name, messageType, seqid) {
    'use strict';
    this.rstack = [];
    this.rpos = [];

    this.robj = this.transport.readAll();
    if (typeof this.robj === 'string') {
      if (typeof jQuery !== 'undefined') {
        this.robj = jQuery.parseJSON(this.robj);
      } else if (JSON) {
        this.robj = JSON.parse(this.robj);
      } else {
        throw new Error('Could not find a JSON-parsing library');
      }
    }

    var r = {};
    var version = this.robj.shift();

    if (version != Protocol.Version) {
      throw Error('Wrong thrift protocol version: ' + version);
    }

    r.fname = this.robj.shift();
    r.mtype = this.robj.shift();
    r.rseqid = this.robj.shift();


    // get to the main obj
    this.rstack.push(this.robj.shift());

    return r;
  },

  readMessageEnd: function() {
    'use strict';
  },

  readStructBegin: function(name) {
    'use strict';
    var r = {};
    r.fname = '';

    // incase this is an array of structs
    if (this.rstack[this.rstack.length - 1] instanceof Array) {
      this.rstack.push(this.rstack[this.rstack.length - 1].shift());
    }

    return r;
  },

  readStructEnd: function() {
    'use strict';
    if (this.rstack[this.rstack.length - 2] instanceof Array) {
      this.rstack.pop();
    }
  },

  readFieldBegin: function() {
    'use strict';
    var r = {};

    var fid = -1;
    var ftype = Type.STOP;

    // get a fieldId
    for (var f in (this.rstack[this.rstack.length - 1])) {
      if (f === null) {
        continue;
      }

      fid = parseInt(f, 10);
      this.rpos.push(this.rstack.length);

      var field = this.rstack[this.rstack.length - 1][fid];

      // remove so we don't see it again
      delete this.rstack[this.rstack.length - 1][fid];

      this.rstack.push(field);

      break;
    }

    if (fid != -1) {

      // should only be 1 of these but this is the only
      // way to match a key
      for (var i in (this.rstack[this.rstack.length - 1])) {
        if (Protocol.RType[i] === null) {
          continue;
        }

        ftype = Protocol.RType[i];
        this.rstack[this.rstack.length - 1] =
            this.rstack[this.rstack.length - 1][i];
      }
    }

    r.fname = '';
    r.ftype = ftype;
    r.fid = fid;

    return r;
  },

  readFieldEnd: function() {
    'use strict';
    var pos = this.rpos.pop();

    // get back to the right place in the stack
    while (this.rstack.length > pos) {
      this.rstack.pop();
    }

  },

  readMapBegin: function(keyType, valType, size) {
    'use strict';
    var map = this.rstack.pop();

    var r = {};
    r.ktype = Protocol.RType[map.shift()];
    r.vtype = Protocol.RType[map.shift()];
    r.size = map.shift();


    this.rpos.push(this.rstack.length);
    this.rstack.push(map.shift());

    return r;
  },

  readMapEnd: function() {
    'use strict';
    this.readFieldEnd();
  },

  readListBegin: function(elemType, size) {
    'use strict';
    var list = this.rstack[this.rstack.length - 1];

    var r = {};
    r.etype = Protocol.RType[list.shift()];
    r.size = list.shift();

    this.rpos.push(this.rstack.length);
    this.rstack.push(list);

    return r;
  },

  readListEnd: function() {
    'use strict';
    this.readFieldEnd();
  },

  readSetBegin: function(elemType, size) {
    'use strict';
    return this.readListBegin(elemType, size);
  },

  readSetEnd: function() {
    'use strict';
    return this.readListEnd();
  },

  readBool: function() {
    'use strict';
    var r = this.readI32();

    if (r !== null && r.value == '1') {
      r.value = true;
    } else {
      r.value = false;
    }

    return r;
  },

  readByte: function() {
    'use strict';
    return this.readI32();
  },

  readI16: function() {
    'use strict';
    return this.readI32();
  },

  readI32: function(f) {
    'use strict';
    if (f === undefined) {
      f = this.rstack[this.rstack.length - 1];
    }

    var r = {};

    if (f instanceof Array) {
      if (f.length === 0) {
        r.value = undefined;
      } else {
        r.value = f.shift();
      }
    } else if (f instanceof Object) {
      for (var i in f) {
        if (i === null) {
          continue;
        }
        this.rstack.push(f[i]);
        delete f[i];

        r.value = i;
        break;
      }
    } else {
      r.value = f;
      this.rstack.pop();
    }

    return r;
  },

  readI64: function() {
    'use strict';
    return this.readI32();
  },

  readDouble: function() {
    'use strict';
    return this.readI32();
  },

  readString: function() {
    'use strict';
    var r = this.readI32();
    return r;
  },

  readBinary: function() {
    'use strict';
    return this.readString();
  },


  // Method to arbitrarily skip over data.
  skip: function(type) {
    'use strict';
    throw Error('skip not supported yet');
  },

  flush: function(callback) {
    'use strict';
    var wrapTransport;

    if (callback) {
      wrapTransport = function(err, trans) {
        var protocol;
        if (trans) {
          protocol = new Protocol(trans);
        }
        return callback(err, protocol);
      };
    }

    return this.transport.flush(wrapTransport);
  }
};

module.exports = Protocol;
