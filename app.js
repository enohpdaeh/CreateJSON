var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ajax_test');

var YQL = require('yql');

var query = new YQL('SELECT * FROM weather.bylocation WHERE location="Fujisawa" AND unit="c"');

var weatherRepo;

//fujisawaの天気を取得してjson化
query.exec(function(err, data) {
  var location = data.query.results.weather.rss.channel.location;
  var condition = data.query.results.weather.rss.channel.item.condition;
  //console.log("{weather :" + JSON.stringify(location) + "," + JSON.stringify(condition) + "}");
  weatherRepo = "{\"weather\" :[" + JSON.stringify(location) + "," + JSON.stringify(condition) + "]}";
});

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

//todoスキーマを定義
var Schema = mongoose.Schema;
var todoSchema = new Schema({
  isCheck     : {type: Boolean, default: false},
  text        : String,
  createdDate : {type: Date, default: Date.now},
  limitDate   : Date
});
mongoose.model('Todo', todoSchema);

// /todoにGETアクセスしたとき、ToDo一覧を取得するAPI
app.get('/todo', function(req, res) {
  //var Todo = mongoose.model('Todo');
  // すべてのToDoを取得して送る
  //Todo.find({}, function(err, todos) {
    //res.send(todos);
  //});
  res.send(weatherRepo);
});

// /todoにPOSTアクセスしたとき、ToDoを追加するAPI
app.post('/todo', function(req, res) {
  var name = req.body.name;
  var limit = req.body.limit;
  // ToDoの名前と期限のパラーメタがあればMongoDBに保存
  if(name && limit) {
    var Todo = mongoose.model('Todo');
    var todo = new Todo();
    todo.text = name;
    todo.limitDate = limit;
    todo.save();

    res.send(true);
  } else {
    res.send(false);
  }
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
