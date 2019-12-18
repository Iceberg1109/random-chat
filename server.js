let express = require('express'),
    app = express(),
    http = require('http').Server(app),
    dotenv = require('dotenv');

const socketserver = require('./socket');
dotenv.config();

var path = __dirname + '/app/view/';

// var favicon = require('serve-favicon');
// app.use(favicon(path + 'img/mdb-favicon.ico'));
app.use(express.static(path));
  
app.get("/",function(req,res){
    res.sendFile(path + "index.html");
});

app.get("/chat",function(req,res){
    res.sendFile(path + "chat.html");
});

exports.server = http.listen(8000, function(){
        console.log("Live at Port 8000");
    }
)
SocketServer(http)