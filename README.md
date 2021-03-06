A clear declarative wrapper for server-side socket.io sockets.

Example:

```javascript
var SocketEventHandler = require('socket_event_handler');

function MySocketEventHandler(socket, model) {
  this.model = model;
  SocketEventHandler.apply(this, arguments);
}
util.inherits(MySocketEventHandler, SocketEventHandler);

// prototype.events
// The key is the name of the event.
// The property is a function to handle the event.

// Handlers are executed with 'this' as the EventHandler
MySocketEventHandler.prototype.events = {
  "event-name": function handlerForEventName(args) {
    if (this.model.isSomething()) {
      this.model.andSoOn();
    }
  },

  "other-event-name": function handlerForEventName(args) {
  }
};

// prototype.rooms 
// A function that returns an array of strings.
// The EventHandler will subscribe the Socket to all of those rooms. 
MySocketEventHandler.prototype.rooms = function() {
  // Return an array of rooms you'd like to join from this function
  var basicRooms = ["rooms", "to", "join"];
  var myRoomName = "myRoom/"+this.model.id;
  basicRooms.push(myRoomName);

  return basicRooms;
};

// prototype.filters
// Similar to the events object.
// All filters will be run in parallel against
// all incoming socket events.

// Potential use cases include logging
// and permissions.
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

# License

```
Copyright (C) 2012 GoInstant Inc. 

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
