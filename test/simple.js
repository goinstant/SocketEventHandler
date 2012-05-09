var util = require('util');
var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;
var assert = require('assert');
var sinon = require('sinon');
/* mocha globals for jshint: */
/*global describe it */

var SocketEventHandler = require('../socket_event_handler').SocketEventHandler;

function TestSocketEventHandler(socket, options) {
  SocketEventHandler.apply(this, arguments);
}
util.inherits(TestSocketEventHandler, SocketEventHandler);

var testSocketEventHandlerRooms = ["fake", "array"];

TestSocketEventHandler.prototype.rooms = function(channel, userSession, socket) {
  return testSocketEventHandlerRooms;
};

TestSocketEventHandler.prototype.events = {
  "disconnected" : function thirdRoomName() {
  },
  "finishedLoadingPage": function eventName() {
  },
  "other-event-name" : function otherEventName() {
  }
};

function createFakeSocket() {
  var socket = new EventEmitter();

  socket.__fakeEmit = socket.emit;
  socket.emit = sinon.stub();

  socket.on = sinon.spy(socket, "on");
  socket.join = sinon.stub();

  return socket;
}

describe("SocketEventHandler", function() {

  it("joins the rooms the room method supplies", function() {
    var socket = createFakeSocket();
    var testSocketEventHandler = new TestSocketEventHandler(socket);
    
    testSocketEventHandlerRooms.forEach(function(rm) {
      sinon.assert.calledWith(socket.join, rm);
    });
  });

  it("subscribes to all socket events", function() {
    var events = TestSocketEventHandler.prototype.events;
    var socket = createFakeSocket();
    var testSocketEventHandler = new TestSocketEventHandler(socket);
    
    _.each(events, function(fn, eventName) {
      sinon.assert.calledWith(socket.on, eventName);
    });
  });

  it("calls handlers when the socket emits", function() {
    var socket = createFakeSocket();
    var events = TestSocketEventHandler.prototype.events;

    _.each(events, function(fn, eventName) {
      sinon.spy(events, eventName);
    });

    var testSocketEventHandler = new TestSocketEventHandler(socket);

    var fakeArgument = "swoo";

    _.each(events, function(fn, eventName) {
      socket.__fakeEmit(eventName, fakeArgument);
      // the call should happen synchronously when there's no filters
      var call = fn.lastCall;
      assert.ok(call.calledWith(fakeArgument));
      assert.ok(call.thisValue === testSocketEventHandler);
    });

  });
});
