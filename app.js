var LindaClient = require('linda').Client;
var socket = require('socket.io-client').connect('http://linda-server.herokuapp.com/');
//var socket = require('socket.io-client').connect('http://localhost:8931/');
var linda = new LindaClient().connect(socket);
var ts = linda.tuplespace('delta');
var http = require('http'), fs = require('fs');
var now = new Date();

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();

var YQL = require('yql');
var query = new YQL('SELECT * FROM weather.bylocation WHERE location="Fujisawa" AND unit="c"');
var weatherRepo;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

//Lindaから明るさ、温度を取得
var tupleType, tupleName;
var reqArray = [
  ["sensor", "light"],
  ["sensor", "temperature"]
];
var resArray = [];
var lindaJOSN = "{";
var dQ = "\"";
var coron = ":";
var canma = ",";

//lindaに接続
linda.io.on('connect', function(){
  console.log('socket.io connect!!');
});

//reqArrayに入っているkeyでvalueを取得
function getValue(){
  for(var i = 0; i < reqArray.length; i++){
    tupleType = reqArray[i][0];
    tupleName = reqArray[i][1];
    ts.read({type:tupleType, name:tupleName}, function(err, tuple){
      if(err) return;
      resArray.push(tuple.data.value);
      console.log(tuple.data.value);
    });
  }
}
//getvalueで受け取った値をJSON化
function valueToJSON(){
  setTimeout(function(){
    for(var i = 0; i < resArray.length; i++){
      lindaJOSN = lindaJOSN.concat(dQ + i.toString() + dQ + coron + dQ + resArray[i] + dQ + canma);
    }
    lindaJOSN = lindaJOSN.slice(0, -1);
    lindaJOSN = lindaJOSN.concat("}");
    console.log(lindaJOSN);
  },3000);
}

//fujisawaの天気を取得してjson化
function getRec(){
  query.exec(function(err, data) {
    getValue();
    valueToJSON();
    var location = data.query.results.weather.rss.channel.location;
    var now = new Date();
    var condition = data.query.results.weather.rss.channel.item.condition;
    weatherRepo = "{\"weather\" :[" + JSON.stringify(location) + "," + JSON.stringify(condition) + "," + lindaJOSN + "]}";
    console.log(weatherRepo);
  });
}

// /JSONにGETアクセスしたとき、JSONを返す
app.get('/JSON', function(req, res) {
  getRec();
  res.send(weatherRepo);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
