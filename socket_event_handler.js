var async = require('async');

function SocketEventHandler(socket, options) {
  this.socket = socket;
  
  var roomsToJoin = this.rooms ? this.rooms() : [];

  for (var eventName in this.events) {
    var handler = (this.filters) ?
      // filtered, bound to this object
      this._filterEvent.bind(this, eventName) :
      // direct, bound to this object
      this.events[eventName].bind(this);
    socket.on(eventName, handler);
  }

  roomsToJoin.forEach(function(roomName) {
    socket.join(roomName);
  });
}

SocketEventHandler.prototype._filterEvent = function _filterEvent(eventName/*, ...origArgs */) {
  var origArgs = Array.prototype.slice.call(arguments,1);
  var outstanding = Object.keys(this.filters).length;
  var handler = this.events[eventName];

  var tasks = Object.keys(this.filters).map(function(filterName) {
    return this.filters[filterName].bind(this, eventName, origArgs);
  }.bind(this));
  async.parallel(tasks, function(err) {
    if (err) return;
    // bind origArgs late in case filters modify them:
    var thunk = handler.bind.apply(handler, [this].concat(origArgs));
    process.nextTick(thunk);
  }.bind(this));
};

SocketEventHandler.prototype.broadcast = function broadcast(roomName, includeSelf/*, eventName, ...*/) {
  var room = this.socket.broadcast.to(roomName);
  room.emit.apply(this.socket, arguments);
  
  if (includeSelf) {
    var args = Array.prototype.slice.apply(arguments, 2); // strip roomName and includeSelf
    this.emit.apply(this, args);
  }
};

SocketEventHandler.prototype.emit = function emit() {
  this.socket.apply(this.socket, arguments);
};

exports.SocketEventHandler = SocketEventHandler;
