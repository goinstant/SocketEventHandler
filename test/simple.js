var util = require('util');

var _ = require("underscore");

var EventEmitter = require("events").EventEmitter;

var assert = require('assert');
var sinon = require('sinon');

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
  var events = events;

  it("joins the rooms the room method supplies", function() {
    var socket = createFakeSocket();
    var testSocketEventHandler = new TestSocketEventHandler(socket);
    
    testSocketEventHandlerRooms.forEach(function(rm) {
      sinon.assert.calledWith(socket.join, rm);
    });
  });

  it("subscribes to all socket events", function() {
    var socket = createFakeSocket();
    var testSocketEventHandler = new TestSocketEventHandler(socket);
    
    _.each(events, function(fn, eventName) {
      sinon.assert.calledWith(socket.on, eventName);
    });
  });

  it("calls handlers when the socket emits", function() {
    var socket = createFakeSocket();

    _.each(events, function(fn, eventName) {
      sinon.spy(events, eventName);
    });

    var testSocketEventHandler = new TestSocketEventHandler(socket);

    var fakeArgument = "swoo";

    _.each(events, function(fn, eventName) {
      socket.__fakeEmit(eventName, fakeArgument);
    });

    _.each(events, function(fn, eventName) {
      sinon.assert.calledWith(fn, fakeArgument);
    });

    _.each(events, function(fn, eventName) {
      fn.restore();
    });
  });
});
