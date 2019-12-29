let express = require('express'),
  app = express(),
  http = require('http').Server(app),
  dotenv = require('dotenv'),
  bodyParser = require('body-parser'),
  geoip = require('geoip-lite'),
  engines = require('consolidate'),
  mysql = require('mysql'),
  bcrypt = require('bcrypt');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "rdchat"
});

con.connect(function(err) {
  if (err) throw err;
});

global.con = con;

const socketserver = require('./socket');
dotenv.config();
var path = __dirname + '/app/view/';

app.enable('trust proxy');
app.use(express.static(path));

app.use(bodyParser.urlencoded({ extended: false }));
 
app.use(bodyParser.json())

app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.get("/",(req,res) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(ip);
  var temp = ip.split(':');
  var ipv4 = temp[temp.length - 1];

  var query = "SELECT * FROM users WHERE isblocked = 'yes' and ip='" + ipv4 + "'";
  console.log(query);
  con.query(query, function (err, result, fields) {
    if (err) throw err;
    console.log(result.length);
    if (result.length == 0) {
      var geo = geoip.lookup(ip);
      var country = geo ? geo.country : "Unknown";

      console.log(country);
      res.render(path + "join.html", {country :country});
    }
    else {
      res.status(500).send();
    }
  });
  
});
app.get("/chat",(req,res) =>{
  res.render(path + "chat.html");
});

app.get("/admin", (req,res) =>{
  res.render(path + "admin_login.html");
});
app.post("/admin", (req,res) =>{
  var query = "SELECT * FROM admins WHERE username='" + req.body.name + "'";
  console.log(query);
  con.query(query, async function (err, result, fields) {
    if (err) throw err;
    if (result.length == 0) {
      res.status(200).send('fail');
    }
    for (let admin of result) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      console.log(hashedPassword);
      if (await bcrypt.compare(req.body.password, admin.password)) {
        console.log("1");
        res.status(200).send('success');
      } else {
        console.log("0");
        res.status(200).send('fail');
      }
    }
  });
});
app.get("/ip_table", (req,res) =>{
  res.render(path + "ip_table.html");
});
app.post("/ip_table", (req,res) =>{
  con.query("SELECT * FROM users", function (err, result, fields) {
    if (err) {
      res.status(500).send();
      throw err;
    }
    // var users = JSON.stringify(result);
    res.send(result);
  });
});
app.post("/block", (req,res) =>{
  var sql = "UPDATE users SET isblocked = 'yes' WHERE id = '" + req.body.id + "'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result.affectedRows + " record(s) updated");
    res.send("success");
  });
});
app.post("/unblock", (req,res) =>{
  var sql = "UPDATE users SET isblocked = 'no' WHERE id = '" + req.body.id + "'";
  console.log(sql, req.body.id);
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log(result.affectedRows + " record(s) updated");
    res.send("success");
  });
});
exports.server = http.listen(8000, function(){
    console.log("Live at Port 8000");
  }
)
SocketServer(http)