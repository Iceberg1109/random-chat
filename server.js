let express = require('express'),
    app = express(),
    http = require('http').Server(app),
    dotenv = require('dotenv');

const socketserver = require('./socket');
dotenv.config();

app.get('/', function(req, res) {
    res.send("This is Random Chat Back-End");
});

exports.server = http.listen(
    (process.env.MODE == "development")?process.env.DEV_PORT:process.env.PROD_PORT
)
Socketserver(http)