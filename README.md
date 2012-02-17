A clear declarative wrapper for server-side socket.io sockets.

Example:

```javascript
var SocketEventHandler = require('socket_event_handler');

function MySocketEventHandler(socket, model) {
  this.model = model;
  this.constructor.prototype.super_.apply(this, arguments);
}
util.inherits(MySocketEventHandler, SocketEventHandler);

MySocketEventHandler.prototype.events = {
  "event-name": function handlerForEventName(args) {
  },

  "other-event-name": function handlerForEventName(args) {
  }
};

MySocketEventHandler.prototype.rooms = function() {
  // Return an array of rooms you'd like to join from this function
  var basicRooms = ["rooms", "to", "join"];
  var myRoomName = "myRoom/"+this.model.id;
  basicRooms.push(myRoomName);

  return basicRooms;
};

// filters will
MySocketEventHandler.prototype.filters = {
  "log": function(eventName, originalArguments, callback) {
    if (eventName == "stupid") {
      // if you callback with anything truthy
      // the handler will not get triggered
      return callback("error"); 
    }

    console.log(eventName, originalArguments);

    // Call the callback to carry it along 
    callback();
  },

  "security": function(eventName, originalArguments, callback) {
    asyncSecurityCheck(this.model, function(err, allowed) {
      if (err) return callback(err);
      if (!allowed) return callback("not allowed!");

      callback();
    });
  }
};
```
