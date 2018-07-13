var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var clientIds = [];
var clientUsernames = [];
var messageCount = 0;

function MessageQueue(size) {
  this.messages = [];
  this.size = size;

  this.addMessage = function(data) {
    if (this.messages.length < size) {
      this.messages.push(data);
    } else {
      this.messages.shift();
      this.messages.push(data);
    }
  }
}

var recentMessages = new MessageQueue(100);

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    socket.on('new user', function(userId) {
        clientIds.push(userId);
        clientUsernames.push('');
        var msg = 'user ' + userId + ' connected!';
        console.log(msg);
        recentMessages.addMessage(msg);
        io.to(socket.id).emit('recent', recentMessages);
        socket.broadcast.emit('chat message', msg);
    });
    socket.on('username', function(arr) {
        var userIndex = clientIds.indexOf(socket.id);
        clientUsernames[userIndex] = arr[1];
        var msg = 'user ' + arr[0] + ' changed name to ' + arr[1];
        console.log(msg);
        recentMessages.addMessage(msg);
        io.emit('chat message', msg);
    });
    socket.on('disconnect', function() {
        var userIndex = clientIds.indexOf(socket.id);
        var departingUser = clientUsernames[userIndex];
        if (departingUser === '') {
            var msg = 'user '+ socket.id + ' left the chat.';
            console.log(msg);
            recentMessages.addMessage(msg);
            io.emit('chat message', msg);
        } else {
            var msg = departingUser + ' left the chat.';
            console.log(msg);
            recentMessages.addMessage(msg);
            io.emit('chat message', msg);
        }
        clientIds.splice(userIndex, 1);
        clientUsernames.splice(userIndex, 1);
    });
    socket.on('chat message', function(msg) {
        console.log('message ' + messageCount.toString() + ': ' + msg);
        recentMessages.addMessage(msg);
        io.emit('chat message', msg);
        messageCount++;
    });
});

http.listen(3000, function(){
  console.log('listening on port 3000');
});
