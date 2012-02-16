var async = require('async');
var _ = require('underscore');

function EventHandler(channel, userSession, socket) {
  this.socket = socket;
  
  var roomsToJoin = this.rooms();

  _.each(roomsToJoin, function(roomName) {
    this.socket.join(roomName);
  }, this);

  _.each(this.events, function(handler, eventName) {
    if (this.filters) {
      handler = this._filter.bind(this, handler.bind(this));
    }
    this.socket.on(eventName, handler);
  }, this);
}

EventHandler.prototype._filter = function(handler) {
  var origArgs = Array.prototype.slice.apply(arguments, 1);

  var appliedFilters = _.map(this.filters, function(filter) { 
    return filter.bind(origArgs);
  });
  
  async.parallel(appliedFilters, function(err) {
    if (err) {
      return;
    }

    handler.apply(this, origArgs);

  }.bind(this));
};

EventHandler.prototype.broadcast = function broadcast(roomName, includeSelf, eventName) {
  var args = Array.prototype.slice.apply(arguments, 2);

  this.socket.broadcast.to(roomName).emit.apply(this.socket, arguments);
  
  if (includeSelf) {
    this.emit.apply(this.socket, args);
  }
};

EventHandler.prototype.emit = function emit() {
  this.socket.apply(this.socket, arguments);
};

exports.EventHandler = EventHandler;
