var LindaClient = require('linda').Client;
//var socket = require('socket.io-client').connect('http://linda-server.herokuapp.com/');
var socket = require('socket.io-client').connect('http://nkym-linda.herokuapp.com/');
var linda = new LindaClient().connect(socket);
var ts = linda.tuplespace('delta');
var http = require('http'), fs = require('fs');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();
var test = require('./test.js');

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

test.writeLinda();
//Lindaから明るさ、温度を取得
var tupleType, tupleName;
var reqArray = [
  ["sensor", "light"],
  ["sensor", "temperature"],
  ["weather", "city"],
  ["weather", "temp"],
  ["weather", "text"]
];
var resArray;
var dQ = "\"";
var coron = ":";
var canma = ",";

//lindaに接続
linda.io.on('connect', function(){
  console.log('socket.io connect!!');
});

//reqArrayに入っているkeyでvalueを取得
function getValue(){
  resArray = [];
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

var lindaJSON = "{";
//getvalueで受け取った値をJSON化
function valueToJSON(){
  setTimeout(function(){
    lindaJSON = "{";
    for(var i = 0; i < resArray.length; i++){
      lindaJSON = lindaJSON.concat(dQ + i.toString() + dQ + coron + dQ + resArray[i] + dQ + canma);
    }
    lindaJSON = lindaJSON.slice(0, -1);
    lindaJSON = lindaJSON.concat("}");
    console.log("lindaJSON is : " + lindaJSON);
  },3000);
}

var resJSON = "";
//各種JSONを繋げる
function getRec(){
    getValue();
    valueToJSON();
    resJSON = "{\"weather\" :[" + lindaJSON + "]}";
    console.log(resJSON);
}

// /JSONにGETアクセスしたとき、JSONを返す
app.get('/JSON', function(req, res) {
  getRec();
  res.send(resJSON);
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
