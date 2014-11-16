var LindaClient = require('linda').Client;
var socket = require('socket.io-client').connect('http://linda-server.herokuapp.com/');
var linda = new LindaClient().connect(socket);

var ts = linda.tuplespace('delta');
var name = "";
var temp_value = "";
var light_value = "";
var http = require('http'), fs = require('fs');
var now = new Date();

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

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
app.use('/users', users);

//Lindaから明るさ、温度を取得
linda.io.on('connect', function(){
  print('socket.io connect!!');

  ts.read({type:"sensor", name:"light"}, function(err, tuple){
    if(err) return;
    name = tuple.data.name;
    light_value = tuple.data.value;
  });
  ts.read({type:"sensor", name:"temperature"}, function(err, tuple){
    if(err) return;
    name = tuple.data.name;
    temp_value = tuple.data.value;
  });

});

var print = function(msg){
  console.log(msg);
  if(typeof msg === 'object') msg = JSON.stringify(msg);
};

var http = require('http'), fs = require('fs');

//fujisawaの天気を取得してjson化
function getRec(){
  query.exec(function(err, data) {
    var location = data.query.results.weather.rss.channel.location;
    var now = new Date();
    var condition = data.query.results.weather.rss.channel.item.condition;
    var temp_light =  ',{"delta_light":"' + light_value + '","delta_temp":"' + temp_value + '","delta_time":"' + now + '"}';
    weatherRepo = "{\"weather\" :[" + JSON.stringify(location) + "," + JSON.stringify(condition) + temp_light + "]}";
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
