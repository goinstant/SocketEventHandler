var util = require('util');

var _ = require("underscore");

var EventEmitter = require("events").EventEmitter;

var assert = require('assert');
var sinon = require('sinon');

var SocketEventHandler = require('../socket_event_handler').SocketEventHandler;

function TestFilterSocketEventHandler(socket, options) {
  this.constructor.super_.apply(this, arguments);
}
util.inherits(TestFilterSocketEventHandler, SocketEventHandler);

var testFilterSocketEventHandlerRooms = ["fake", "array"];

TestFilterSocketEventHandler.prototype.rooms = function(socket) {
  return testFilterSocketEventHandlerRooms;
};

TestFilterSocketEventHandler.prototype.events = {
  "disconnected" : function thirdRoomName() {
  },
  "finishedLoadingPage": function eventName() {
  },
  "other-event-name" : function otherEventName() {
  }
};

TestFilterSocketEventHandler.prototype.filters = {
  "log": function(eventName, otherArguments, cb){
    cb();
  },
};

function restoreFn(fn) {
  fn.restore();
}

function createFakeSocket() {
  var socket = new EventEmitter();

  socket.__fakeEmit = socket.emit;
  socket.emit = sinon.stub();

  socket.on = sinon.spy(socket, "on");
  socket.join = sinon.stub();

  return socket;
}

describe("SocketEventHandler", function() {
  it("calls handlers when the socket emits", function() {
    var events = TestFilterSocketEventHandler.prototype.events;
    var filters = TestFilterSocketEventHandler.prototype.filters;

    var socket = createFakeSocket();

    _.each(events, function(fn, eventName) {
      sinon.spy(TestFilterSocketEventHandler.prototype.events, eventName);
    });

    var testFilterSocketEventHandler = new TestFilterSocketEventHandler(socket);

    var fakeArgument = "swoo";

    _.each(events, function(fn, eventName) {
      socket.__fakeEmit(eventName, fakeArgument);
    });

    _.each(events, function(fn, eventName) {
      sinon.assert.calledWith(fn, fakeArgument);
    });

    _.each(events, restoreFn);
  });

  it("calls the filters when the socket emits", function() {
    var socket = createFakeSocket();

    var events = TestFilterSocketEventHandler.prototype.events;
    var filters = TestFilterSocketEventHandler.prototype.filters;

    _.each(events, function(fn, eventName) {
      sinon.spy(events, eventName);
    });

    _.each(filters, function(fn, filterName) {
      sinon.spy(filters, filterName);
    });

    var testFilterSocketEventHandler = new TestFilterSocketEventHandler(socket);

    var arg = 0;
    var arg2 = 1;
    _.each(events, function(fn, eventName) {
      socket.__fakeEmit(eventName, arg, arg2);
      
      _.each(filters, function(fn, filterName) {
        sinon.assert.calledWith(fn, eventName, [arg, arg2]);
      });
      arg += 1;
    });

    _.each(filters, restoreFn);

    _.each(events, restoreFn);
  });

  it("does not call the handler when the filter calls back with an error", function() {
    var socket = createFakeSocket();

    var testFilterSocketEventHandler = new TestFilterSocketEventHandler(socket);

    var filters = TestFilterSocketEventHandler.prototype.filters;
    var events = TestFilterSocketEventHandler.prototype.events;

    _.each(events, function(fn, eventName) {
      sinon.spy(events, eventName);
    });

    _.each(filters, function(fn, filterName) {
      sinon.stub(filters, filterName)
           .yields("error!");
    });

    _.each(events, function(fn, eventName) {
      socket.__fakeEmit(eventName);

      sinon.assert.notCalled(fn);
    });

    _.each(events, restoreFn);
    _.each(filters, restoreFn);
  });
});
