var util = require('util');

var _ = require("underscore");

var EventEmitter = require("events").EventEmitter;

var assert = require('assert');
var sinon = require('sinon');

var EventHandler = require('../event_handler').EventHandler;

function TestFilterEventHandler(socket, options) {
  this.constructor.super_.apply(this, arguments);
}
util.inherits(TestFilterEventHandler, EventHandler);

var testFilterEventHandlerRooms = ["fake", "array"];

TestFilterEventHandler.prototype.rooms = function(channel, userSession, socket) {
  return testFilterEventHandlerRooms;
};

TestFilterEventHandler.prototype.events = {
  "disconnected" : function thirdRoomName() {
  },
  "finishedLoadingPage": function eventName() {
  },
  "other-event-name" : function otherEventName() {
  }
};

TestFilterEventHandler.prototype.filters = {
  "log": function(otherArguments, cb){
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

describe("EventHandler", function() {
  it("calls handlers when the socket emits", function() {
    var events = TestFilterEventHandler.prototype.events;
    var filters = TestFilterEventHandler.prototype.filters;

    var socket = createFakeSocket();

    _.each(events, function(fn, eventName) {
      sinon.spy(TestFilterEventHandler.prototype.events, eventName);
    });

    var testFilterEventHandler = new TestFilterEventHandler(socket);

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

    var events = TestFilterEventHandler.prototype.events;
    var filters = TestFilterEventHandler.prototype.filters;

    _.each(events, function(fn, eventName) {
      sinon.spy(events, eventName);
    });

    _.each(filters, function(fn, filterName) {
      sinon.spy(filters, filterName);
    });

    var testFilterEventHandler = new TestFilterEventHandler(socket);

    var arg = 0;
    _.each(events, function(fn, eventName) {
      socket.__fakeEmit(eventName, eventName, arg);
      
      _.each(filters, function(fn, filterName) {
        sinon.assert.calledWith(fn, [eventName, arg]);
      });
      arg += 1;
    });

    _.each(filters, restoreFn);

    _.each(events, restoreFn);
  });

  it("does not call the handler when the filter calls back with an error", function() {
    var socket = createFakeSocket();

    var testFilterEventHandler = new TestFilterEventHandler(socket);

    var filters = TestFilterEventHandler.prototype.filters;
    var events = TestFilterEventHandler.prototype.events;

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
