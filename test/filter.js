var util = require('util');
var _ = require("underscore");
var EventEmitter = require("events").EventEmitter;
var assert = require('assert');
var sinon = require('sinon');
/* mocha globals for jshint: */
/*global describe it */

var SocketEventHandler = require('../socket_event_handler').SocketEventHandler;

function TestFilterSocketEventHandler(socket, options) {
  SocketEventHandler.apply(this, arguments);
}
util.inherits(TestFilterSocketEventHandler, SocketEventHandler);

var testFilterSocketEventHandlerRooms = ["fake", "array"];

TestFilterSocketEventHandler.prototype.rooms = function(socket) {
  return testFilterSocketEventHandlerRooms;
};

TestFilterSocketEventHandler.prototype.events = {
  "disconnected" : function () { },
  "finishedLoadingPage": function () { },
  "other-event-name" : function () { }
};

TestFilterSocketEventHandler.prototype.filters = {
  "log": function(eventName, otherArguments, cb){
    cb();
  },
  "access": function(eventName, otherArguments, cb){
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

/*
 * call callback after n ticks.
 */
function nTicks(n, cb) {
  function tickedyTock() {
    n--;
    if (n === 0) return cb();
    process.nextTick(tickedyTock);
  }
  process.nextTick(tickedyTock);
}

describe("SocketEventHandler", function() {
  it("calls handlers when the socket emits", function(done) {
    var events = TestFilterSocketEventHandler.prototype.events;
    var filters = TestFilterSocketEventHandler.prototype.filters;

    var socket = createFakeSocket();

    _.each(events, function(fn, eventName) {
      sinon.spy(events, eventName);
    });

    var testFilterSocketEventHandler = new TestFilterSocketEventHandler(socket);

    _.each(events, function(fn, eventName) {
      socket.__fakeEmit(eventName, "this-is-"+eventName);
      assert.equal(fn.callCount, 0); // it's called *async*
    });


    nTicks(3,function() {
      _.each(events, function(fn, eventName) {
        assert.equal(fn.callCount, 1);
        assert.ok(fn.lastCall.thisValue === testFilterSocketEventHandler);
        assert.equal(fn.lastCall.args[0], "this-is-"+eventName);
      });

      _.each(events, restoreFn);
      done();
    });
  });

  it("calls the filters when the socket emits", function(done) {
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


    _.each(events, function(fn, eventName) {
      socket.__fakeEmit(eventName, 'variable-'+eventName, 'constant');
    });

    nTicks(3,function() {
      _.each(filters, function(fn2, filterName) {
        assert.ok(fn2.called);
        for (var i=0; i<3; i++) {
          assert.ok(fn2.thisValues[i] === testFilterSocketEventHandler);
          var eventName = fn2.args[i][0];
          assert.ok(util.isArray(fn2.args[i][1]));
          // origArgs array:
          assert.equal(fn2.args[i][1][0], 'variable-'+eventName);
          assert.equal(fn2.args[i][1][1], 'constant');
          // continuation:
          assert.equal(typeof fn2.args[i][2], 'function');
        }
      });

      _.each(filters, restoreFn);
      _.each(events, restoreFn);
      done();
    });
  });

  it("does not call the handler when the filter calls back with an error", function(done) {
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

    nTicks(42,function() {
      _.each(events, function(fn, eventName) {
        socket.__fakeEmit(eventName);
        sinon.assert.notCalled(fn);
      });

      _.each(events, restoreFn);
      _.each(filters, restoreFn);
      done();
    });
  });
});
