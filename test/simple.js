var util = require('util');

var _ = require("underscore");

var EventEmitter = require("events").EventEmitter;

var assert = require('assert');
var sinon = require('sinon');

var EventHandler = require('../event_handler').EventHandler;

function TestEventHandler(socket, options) {
  this.constructor.super_.apply(this, arguments);
}
util.inherits(TestEventHandler, EventHandler);

var testEventHandlerRooms = ["fake", "array"];

TestEventHandler.prototype.rooms = function(channel, userSession, socket) {
  return testEventHandlerRooms;
};

TestEventHandler.prototype.events = {
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

describe("EventHandler", function() {
  var events = events;

  it("joins the rooms the room method supplies", function() {
    var socket = createFakeSocket();
    var testEventHandler = new TestEventHandler(socket);
    
    testEventHandlerRooms.forEach(function(rm) {
      sinon.assert.calledWith(socket.join, rm);
    });
  });

  it("subscribes to all socket events", function() {
    var socket = createFakeSocket();
    var testEventHandler = new TestEventHandler(socket);
    
    _.each(events, function(fn, eventName) {
      sinon.assert.calledWith(socket.on, eventName);
    });
  });

  it("calls handlers when the socket emits", function() {
    var socket = createFakeSocket();

    _.each(events, function(fn, eventName) {
      sinon.spy(events, eventName);
    });

    var testEventHandler = new TestEventHandler(socket);

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
