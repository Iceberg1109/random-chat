const CMD = require('./app/const/cmd');
const ChatController = require('./app/controller/chat');

SocketServer = function(http) {
    // Define Server Socket
    let io = require('socket.io')(http);

    // On Client Socket Connected to Server Socket
    io.on('connection', function(socket) {

        // On New Message
        socket.on(CMD.ON_NEW_MESSAGE, (data) => {
            ChatController.OnNewMessage("sender", "receiver", "here is your message", null, null);
        });

        // On Client Socket disconnected from Server Socket
        socket.on('disconnect', function(){
            chat.closeConnection(socket);
        });
    });
}