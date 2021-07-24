//
// Autogenerated by Thrift Compiler (0.7.0-en-11139b3b5cb61e817408c6e84b0e1c258bf6c6ae)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//


  // Define types and services

  var Thrift = require('evernote-thrift').Thrift;
  var CommunicationEngineTypesV2 = require('./CommunicationEngineTypesV2');


  var SharedAPIV2 = module.exports.SharedAPIV2 = {};

  SharedAPIV2.processServerResponse = Thrift.Method.define({
    oneway: true,
    alias: 'processServerResponse',
    args: Thrift.Struct.define('processServerResponseArgs', {
      1: { alias: 'response', type: Thrift.Type.STRUCT, def: CommunicationEngineTypesV2.MessageResponse, index: 0 }
    }),
    result: Thrift.Struct.define('processServerResponseResult')
  });

  SharedAPIV2.initialize = Thrift.Method.define({
    oneway: true,
    alias: 'initialize',
    args: Thrift.Struct.define('initializeArgs', {
      1: { alias: 'request', type: Thrift.Type.STRUCT, def: CommunicationEngineTypesV2.InitializeRequest, index: 0 }
    }),
    result: Thrift.Struct.define('initializeResult')
  });

  SharedAPIV2.requestPlacement = Thrift.Method.define({
    oneway: true,
    alias: 'requestPlacement',
    args: Thrift.Struct.define('requestPlacementArgs', {
      1: { alias: 'placement', type: Thrift.Type.I32, index: 0 }
    }),
    result: Thrift.Struct.define('requestPlacementResult')
  });

  SharedAPIV2.placementIsVisible = Thrift.Method.define({
    oneway: true,
    alias: 'placementIsVisible',
    args: Thrift.Struct.define('placementIsVisibleArgs', {
      1: { alias: 'placement', type: Thrift.Type.I32, index: 0 }
    }),
    result: Thrift.Struct.define('placementIsVisibleResult')
  });

  SharedAPIV2.userAction = Thrift.Method.define({
    oneway: true,
    alias: 'userAction',
    args: Thrift.Struct.define('userActionArgs', {
      1: { alias: 'placement', type: Thrift.Type.I32, index: 0 },
      2: { alias: 'blob', type: Thrift.Type.STRING, index: 1 }
    }),
    result: Thrift.Struct.define('userActionResult')
  });

  SharedAPIV2.placementWasDismissed = Thrift.Method.define({
    oneway: true,
    alias: 'placementWasDismissed',
    args: Thrift.Struct.define('placementWasDismissedArgs', {
      1: { alias: 'placement', type: Thrift.Type.I32, index: 0 }
    }),
    result: Thrift.Struct.define('placementWasDismissedResult')
  });

  SharedAPIV2.placementWillNotBeVisible = Thrift.Method.define({
    oneway: true,
    alias: 'placementWillNotBeVisible',
    args: Thrift.Struct.define('placementWillNotBeVisibleArgs', {
      1: { alias: 'placement', type: Thrift.Type.I32, index: 0 }
    }),
    result: Thrift.Struct.define('placementWillNotBeVisibleResult')
  });

  SharedAPIV2.htmlFetched = Thrift.Method.define({
    oneway: true,
    alias: 'htmlFetched',
    args: Thrift.Struct.define('htmlFetchedArgs', {
      1: { alias: 'uri', type: Thrift.Type.STRING, index: 0 },
      2: { alias: 'html', type: Thrift.Type.STRING, index: 1 }
    }),
    result: Thrift.Struct.define('htmlFetchedResult')
  });

  // Define SharedAPIV2 Client

  function SharedAPIV2Client(output) {
    this.output = output;
    this.seqid = 0;
  }

  SharedAPIV2Client.prototype.processServerResponse = function(response, callback) {
    var mdef = SharedAPIV2.processServerResponse;
    var args = new mdef.args();
    args.response = response;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  SharedAPIV2Client.prototype.initialize = function(request, callback) {
    var mdef = SharedAPIV2.initialize;
    var args = new mdef.args();
    args.request = request;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  SharedAPIV2Client.prototype.requestPlacement = function(placement, callback) {
    var mdef = SharedAPIV2.requestPlacement;
    var args = new mdef.args();
    args.placement = placement;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  SharedAPIV2Client.prototype.placementIsVisible = function(placement, callback) {
    var mdef = SharedAPIV2.placementIsVisible;
    var args = new mdef.args();
    args.placement = placement;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  SharedAPIV2Client.prototype.userAction = function(placement, blob, callback) {
    var mdef = SharedAPIV2.userAction;
    var args = new mdef.args();
    args.placement = placement;
    args.blob = blob;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  SharedAPIV2Client.prototype.placementWasDismissed = function(placement, callback) {
    var mdef = SharedAPIV2.placementWasDismissed;
    var args = new mdef.args();
    args.placement = placement;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  SharedAPIV2Client.prototype.placementWillNotBeVisible = function(placement, callback) {
    var mdef = SharedAPIV2.placementWillNotBeVisible;
    var args = new mdef.args();
    args.placement = placement;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  SharedAPIV2Client.prototype.htmlFetched = function(uri, html, callback) {
    var mdef = SharedAPIV2.htmlFetched;
    var args = new mdef.args();
    args.uri = uri;
    args.html = html;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  module.exports.SharedAPIV2.Client = SharedAPIV2Client;

  // Define SharedAPIV2 Server

  function SharedAPIV2Server(service, stransport, Protocol) {
    var methodName;
      this.service = service;
      this.stransport = stransport;
      this.processor = new Thrift.Processor();
      for (methodName in SharedAPIV2) {
        if (service[methodName]) {
          this.processor.addMethod(SharedAPIV2[methodName], service[methodName].bind(service));
        }
      }
      this.stransport.process = function (input, output, noop) {
      var inprot = new Protocol(input);
      var outprot = new Protocol(output);
      this.processor.process(inprot, outprot, noop);
    }.bind(this);
  }

  SharedAPIV2Server.prototype.start = function () {
    this.stransport.listen();
  };
  SharedAPIV2Server.prototype.stop = function () {
    this.stransport.close();
  };

  module.exports.SharedAPIV2.Server = SharedAPIV2Server;

  var MainAppV2 = module.exports.MainAppV2 = {};

  MainAppV2.syncMessages = Thrift.Method.define({
    oneway: true,
    alias: 'syncMessages',
    args: Thrift.Struct.define('syncMessagesArgs', {
      1: { alias: 'request', type: Thrift.Type.STRUCT, def: CommunicationEngineTypesV2.MessageRequest, index: 0 }
    }),
    result: Thrift.Struct.define('syncMessagesResult')
  });

  MainAppV2.show = Thrift.Method.define({
    oneway: true,
    alias: 'show',
    args: Thrift.Struct.define('showArgs', {
      1: { alias: 'request', type: Thrift.Type.STRUCT, def: CommunicationEngineTypesV2.ShowRequest, index: 0 }
    }),
    result: Thrift.Struct.define('showResult')
  });

  MainAppV2.sendAnalyticsEvent = Thrift.Method.define({
    oneway: true,
    alias: 'sendAnalyticsEvent',
    args: Thrift.Struct.define('sendAnalyticsEventArgs', {
      1: { alias: 'event', type: Thrift.Type.STRUCT, def: CommunicationEngineTypesV2.AnalyticsEvent, index: 0 }
    }),
    result: Thrift.Struct.define('sendAnalyticsEventResult')
  });

  MainAppV2.log = Thrift.Method.define({
    oneway: true,
    alias: 'log',
    args: Thrift.Struct.define('logArgs', {
      1: { alias: 'message', type: Thrift.Type.STRING, index: 0 }
    }),
    result: Thrift.Struct.define('logResult')
  });

  MainAppV2.dismissMessage = Thrift.Method.define({
    oneway: true,
    alias: 'dismissMessage',
    args: Thrift.Struct.define('dismissMessageArgs', {
      1: { alias: 'placement', type: Thrift.Type.I32, index: 0 }
    }),
    result: Thrift.Struct.define('dismissMessageResult')
  });

  MainAppV2.saveState = Thrift.Method.define({
    oneway: true,
    alias: 'saveState',
    args: Thrift.Struct.define('saveStateArgs', {
      1: { alias: 'state', type: Thrift.Type.BINARY, index: 0 }
    }),
    result: Thrift.Struct.define('saveStateResult')
  });

  MainAppV2.placementsAvailable = Thrift.Method.define({
    oneway: true,
    alias: 'placementsAvailable',
    args: Thrift.Struct.define('placementsAvailableArgs', {
      1: { alias: 'placements', type: Thrift.Type.LIST, def: Thrift.List.define(Thrift.Type.I32) , index: 0 }
    }),
    result: Thrift.Struct.define('placementsAvailableResult')
  });

  MainAppV2.fetchHtml = Thrift.Method.define({
    oneway: true,
    alias: 'fetchHtml',
    args: Thrift.Struct.define('fetchHtmlArgs', {
      1: { alias: 'uri', type: Thrift.Type.STRING, index: 0 }
    }),
    result: Thrift.Struct.define('fetchHtmlResult')
  });

  // Define MainAppV2 Client

  function MainAppV2Client(output) {
    this.output = output;
    this.seqid = 0;
  }

  MainAppV2Client.prototype.syncMessages = function(request, callback) {
    var mdef = MainAppV2.syncMessages;
    var args = new mdef.args();
    args.request = request;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MainAppV2Client.prototype.show = function(request, callback) {
    var mdef = MainAppV2.show;
    var args = new mdef.args();
    args.request = request;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MainAppV2Client.prototype.sendAnalyticsEvent = function(event, callback) {
    var mdef = MainAppV2.sendAnalyticsEvent;
    var args = new mdef.args();
    args.event = event;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MainAppV2Client.prototype.log = function(message, callback) {
    var mdef = MainAppV2.log;
    var args = new mdef.args();
    args.message = message;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MainAppV2Client.prototype.dismissMessage = function(placement, callback) {
    var mdef = MainAppV2.dismissMessage;
    var args = new mdef.args();
    args.placement = placement;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MainAppV2Client.prototype.saveState = function(state, callback) {
    var mdef = MainAppV2.saveState;
    var args = new mdef.args();
    args.state = state;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MainAppV2Client.prototype.placementsAvailable = function(placements, callback) {
    var mdef = MainAppV2.placementsAvailable;
    var args = new mdef.args();
    args.placements = placements;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  MainAppV2Client.prototype.fetchHtml = function(uri, callback) {
    var mdef = MainAppV2.fetchHtml;
    var args = new mdef.args();
    args.uri = uri;
    mdef.sendRequest(this.output, this.seqid++, args, callback);
  };

  module.exports.MainAppV2.Client = MainAppV2Client;

  // Define MainAppV2 Server

  function MainAppV2Server(service, stransport, Protocol) {
    var methodName;
      this.service = service;
      this.stransport = stransport;
      this.processor = new Thrift.Processor();
      for (methodName in MainAppV2) {
        if (service[methodName]) {
          this.processor.addMethod(MainAppV2[methodName], service[methodName].bind(service));
        }
      }
      this.stransport.process = function (input, output, noop) {
      var inprot = new Protocol(input);
      var outprot = new Protocol(output);
      this.processor.process(inprot, outprot, noop);
    }.bind(this);
  }

  MainAppV2Server.prototype.start = function () {
    this.stransport.listen();
  };
  MainAppV2Server.prototype.stop = function () {
    this.stransport.close();
  };

  module.exports.MainAppV2.Server = MainAppV2Server;
