var LindaClient = require('linda').Client;
var socket = require('socket.io-client').connect('http://nkym-linda.herokuapp.com/');
var linda = new LindaClient().connect(socket);
var ts = linda.tuplespace('delta');
var tsOdakyu = linda.tuplespace('delta');
var http = require('http'), fs = require('fs');
var YQL = require('yql');
var query = new YQL('SELECT * FROM weather.bylocation WHERE location="Fujisawa" AND unit="c"');
var request = require('request');

var interval = 5000;

//5秒ごとにタプルスペースに書き込み
exports.writeLinda = function(){
  //lindaに接続
  linda.io.on('connect', function(){
    console.log('socket.io connect!!');
  });
  setInterval(function(){
    getWeather();
    getSensor();
    getOdakyuStatus();
    getNexus6Stock();
  },interval);
}

//delta sensorを取得して、lindaに書き込み
//現状はダミーデータ
function getSensor(){
  ts.write({
    type: "sensor",
    name: "light",
    value: "128"
  });
  ts.write({
    type: "sensor",
    name: "temperature",
    value: "16"
  });
}

//YQLでfujisawaの天気を取得してlindaに書き込み
function getWeather(){
  query.exec(function(err, data) {
    var city = data.query.results.weather.rss.channel.location.city;
    var condition = data.query.results.weather.rss.channel.item.condition;
    ts.write({
      type: "weather",
      name: "city",
      value: city
    });
    ts.write({
      type: "weather",
      name: "temp",
      value: condition.temp
    });
    ts.write({
      type: "weather",
      name: "text",
      value: condition.text
    });
  });
}

//kimono apiから小田急の運行情報を取得してlindaにwrite
function getOdakyuStatus(){
  request("https://www.kimonolabs.com/api/94zcgk54?apikey=G3AoDqV8MU2CdL2knzGiEWi7mPBBIvpu",
  function(err, response, body) {
    //console.log(body);
    try{
      var obj = JSON.parse(body);
      var resObj = obj.results.collection1[0];
      tsOdakyu.write({
        type: "odakyu",
        name: "time",
        value: resObj.time
      });
      tsOdakyu.write({
        type: "odakyu",
        name: "status",
        value: resObj.status
      });
    }catch(e){
      console.log(e);
      interval = interval * 2;
    }
  });
}

//kimono apiからNexus6の在庫情報を
function getNexus6Stock(){
  request("https://www.kimonolabs.com/api/d8m9msmq?apikey=G3AoDqV8MU2CdL2knzGiEWi7mPBBIvpu",
  function(err, response, body) {
    try{
      var obj = JSON.parse(body);
      var resObj = obj.results.nexus6_32G_Blue[0];
      tsOdakyu.write({
        type: "nexus6",
        name: "price",
        value: resObj.price
      });
      tsOdakyu.write({
        type: "nexus6",
        name: "stock",
        value: resObj.stock
      });
    }catch(e){
      console.log(e);
      interval = interval * 2;
    }
  });
}
