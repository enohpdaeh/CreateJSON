var _ = require('underscore');
var async = require('async');
var LindaClient = require('linda').Client;
var socket = require('socket.io-client').connect('http://nkym-linda.herokuapp.com/');
var linda = new LindaClient().connect(socket);
var ts = linda.tuplespace('delta');
var tsDummy = linda.tuplespace('dummy');
var http = require('http'), fs = require('fs');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();
var writeLinda = require('./write_linda.js');
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/createjson', function(err){
  if(err){
    console.error(err);
    process.exit(1);
  }
});

// Lindaに各種情報を書き込み
writeLinda.writeLinda();

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

//Tupleスキーマを定義
var Schema = mongoose.Schema;
var tupleSchema = new Schema({
  tupleType : String,
  tupleName : String
});
mongoose.model('Tuple', tupleSchema);

// /tupleにアクセスしたとき、tuple一覧を返す
app.get('/tuple', function(req, res){
  var Tuple = mongoose.model('Tuple');
  // すべてのTupleを取得して送る
  Tuple.find({}, function(err, tuples){
    res.send(tuples);
  });
});

// /tupleにpostがきたらtupleを追加
app.post('/tuple', function(req, res){
  var name = req.body.name;
  var type = req.body.type;
  // nameとtypeがあればmongoに追加
  if(name && type){
    var Tuple = mongoose.model('Tuple');
    var tuple = new Tuple();
    tuple.tupleType = type;
    tuple.tupleName = name;
    tuple.save();

    res.send(true);
  }else{
    res.send(false);
  }
});

// /removeにpostしたら全要素削除
app.post('/remove', function(req, res){
  // 削除
  var Tuple = mongoose.model('Tuple');
  Tuple.remove({},function(err){
  });
  res.send(true);
});


//変数
var tupleType, tupleName;
var reqArray = [];  //Lindaにリクエストするtype,name
var resArray; //Lindaから返ってきたvalue
var lindaJSON = "{";  //resArrayをJSON形式にしたもの
var resJSON = ""; //Androidに送るJSON
//定数
var dQ = "\"";
var coron = ":";
var canma = ",";

//lindaに接続
linda.io.on('connect', function(){
  console.log('socket.io connect!!');
});

// Lindaにリクエストするtypeとnameの組み合わせreqArrayの作成
// reqArray = [[tupleType,tupleName],[tupleType,tupleName]..]
function createReqArray(){
  var Tuple = mongoose.model('Tuple');
  Tuple.find({},function(err, tuples){
    _.each(tuples, function(tuple, index){
      var arr = [];
      arr.push(tuple.tupleType);
      arr.push(tuple.tupleName);
      reqArray.push(arr);
    });
  });
}

//LindaからreqArrayに入っているkeyでvalueを取得
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

//getvalueで受け取った値をJSON化
function valueToJSON(){
  //JSONを初期化
  lindaJSON = "{";
  for(var i = 0; i < resArray.length; i++){
    //resArrayに入っている値をひとつづつカンマ区切りで追加
    //keyは"0"からカウントアップ
    lindaJSON = lindaJSON.concat(dQ + i.toString() + dQ + coron + dQ + resArray[i] + dQ + canma);
  }
  //最後の余計なカンマを除く
  lindaJSON = lindaJSON.slice(0, -1);
  lindaJSON = lindaJSON.concat("}");
  console.log("lindaJSON is : " + lindaJSON);
}

// /JSONにGETアクセスしたとき、JSONを返す
app.get('/JSON', function(req, res) {
  async.waterfall(
    [
    function(callback){
      createReqArray();
      setTimeout(function(){
        console.log(reqArray);
        callback(null);
      },1000);
    },
    function(callback){
      getValue();
      setTimeout(function(){
        callback(null);
      },2000);
    },
    function(callback){
      valueToJSON();
      setTimeout(function(){
        callback(null);
      },2000);
    }
  ], function(){
    resJSON = "{\"info\" :[" + lindaJSON + "]}";
    res.send(resJSON);
    console.log(resJSON);
    reqArray = [];
  });
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
