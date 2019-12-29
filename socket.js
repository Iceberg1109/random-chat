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
      ChatController.OnNewMessage(socket, data.msg, data.img);
    });

    // On guest confirm username
    socket.on(CMD.ON_CONFIRM_NAME, (data) => {
      ChatController.OnConfirmJoin(socket, data);
    });
    // On Guest Find his pair
    socket.on(CMD.ON_FIND_PAIR, (data) => {
      ChatController.OnCreateNewPair(socket, "");
    })
    // On Guest skip current and find another pair
    socket.on(CMD.ON_NEXT_PAIR, (data) => {
      ChatController.OnNextPair(socket, data, true);
    })
    // On Guest skip current and find another pair
    socket.on(CMD.ON_CHNAGE_FILTER, (data) => {
      ChatController.OnChangeFilter(socket, data);
    })
    // On Message Typing
    socket.on(CMD.MESSAGE_TYPING, (data) => {
      ChatController.OnTyping(socket);
    })
    
    // On Message Done Typing
    socket.on(CMD.MESSAGE_DONE_TYPING, (data) => {
      ChatController.OnDoneTyping(socket);
    })
    
    // On Client Socket disconnected from Server Socket
    socket.on('REPORT_USER', function(data){
      ChatController.OnReportUser(socket, data);
    })
    
    // On Client Socket disconnected from Server Socket
    socket.on('disconnect', function(){
      ChatController.OnCloseConnection(socket);
    });
  });
}