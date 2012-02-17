var async = require('async');
var _ = require('underscore');

function SocketEventHandler(socket, options) {
  this.socket = socket;
  
  var roomsToJoin = this.rooms && this.rooms();

  _.each(roomsToJoin, function(roomName) {
    this.socket.join(roomName);
  }.bind(this));

  _.each(this.events, function(handler, eventName) {
    if (this.filters) {
      handler = this._filter.bind(this, eventName, handler.bind(this));
    }
    this.socket.on(eventName, handler);
  }, this);
}

SocketEventHandler.prototype._filter = function(eventName, handler) {
  var origArgs = Array.prototype.slice.call(arguments, 2);

  var appliedFilters = _.map(this.filters, function(filter) { 
    return filter.bind(this, eventName, origArgs);
  }.bind(this));
  
  async.parallel(appliedFilters, function(err) {
    if (err) {
      return;
    }

    handler.apply(this, origArgs);

  }.bind(this));
};

SocketEventHandler.prototype.broadcast = function broadcast(roomName, includeSelf, eventName) {
  var args = Array.prototype.slice.apply(arguments, 2);

  this.socket.broadcast.to(roomName).emit.apply(this.socket, arguments);
  
  if (includeSelf) {
    this.emit.apply(this.socket, args);
  }
};

SocketEventHandler.prototype.emit = function emit() {
  this.socket.apply(this.socket, arguments);
};

exports.SocketEventHandler = SocketEventHandler;
