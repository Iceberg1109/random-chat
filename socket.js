const CMD = require('./app/const/cmd.json');
const ChatController = require('./app/controller/chat');

SocketServer = function(http) {
    // Define Server Socket
    let io = require('socket.io')(http);

    // On Client Socket Connected to Server Socket
    io.on('connection', function(socket) {

        console.log("New Connection from ", socket.id);

        ChatController.OnNewGuesJoined(socket);

        // On New Message
        /**
         * data = {msg: MESSAGE TEXT, img: IMAGE URL, vid: VIDEO URL}
         */
        socket.on(CMD.ON_NEW_MESSAGE, (data) => {
            ChatController.OnNewMessage(socket, data.msg, data.img, data.vid);
        });

        // On guest confirm username
        socket.on(CMD.ON_CONFIRM_NAME, (data) => {
            console.log(data);
            ChatController.OnConfirmName(socket, data.username);
        });

        // On Guest Find his pair
        socket.on(CMD.ON_FIND_PAIR, (data) => {
            ChatController.OnCreateNewPair(socket);
        })

        // On Client Socket disconnected from Server Socket
        socket.on('disconnect', function(){
            ChatController.OnCloseConnection(socket);
        });
    });
}