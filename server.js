let express = require('express'),
    app = express(),
    http = require('http').Server(app),
    dotenv = require('dotenv');

const socketserver = require('./socket');
dotenv.config();
var path = __dirname + '/app/view/';
var geoip = require('geoip-lite');
var engines = require('consolidate');
app.enable('trust proxy');
app.use(express.static(path));

app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.get("/",(req,res) => {
    // console.log("asdfds",req);
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(req.headers['x-forwarded-for']);
    console.log(req.connection.remoteAddress);
    var geo = geoip.lookup(ip);
    var country = geo ? geo.country : "Unknown";

    console.log(country);
    res.render(path + "join.html", {country :country});
    
});
app.get("/chat",(req,res) =>{
    res.render(path + "chat.html");
});

exports.server = http.listen(8000, function(){
        console.log("Live at Port 8000");
    }
)
SocketServer(http)