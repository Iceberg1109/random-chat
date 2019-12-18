let express = require('express'),
    app = express(),
    http = require('http').Server(app),
    dotenv = require('dotenv');

const socketserver = require('./socket');
dotenv.config();

app.use(express.static(__dirname + '/app/view/'));
var path = __dirname + '/app/view/';
  
app.get("/",function(req,res){
    res.sendFile(path + "index.html");
});

exports.server = http.listen(8000, function(){
        console.log("Live at Port 8000");
    }
)
SocketServer(http)