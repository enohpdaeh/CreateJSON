var LindaClient = require('linda').Client;
var socket = require('socket.io-client').connect('http://nkym-linda.herokuapp.com/');
var linda = new LindaClient().connect(socket);
var ts = linda.tuplespace('delta');
var dummyTs = linda.tuplespace('dummy');
var http = require('http'), fs = require('fs');
var YQL = require('yql');
var query = new YQL('SELECT * FROM weather.bylocation WHERE location="Fujisawa" AND unit="c"');

//taple space deltaにweatherを書き込み
exports.writeLinda = function(){
  //lindaに接続
  linda.io.on('connect', function(){
    console.log('socket.io connect!!');
  });
  setInterval(function(){
    getWeather();
    getSensor();
  },2000);
}

//delta sensorを取得して、lindaに書き込み
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
  dummyTs.write({
    type: "dummy",
    name: "dummy01",
    value: "dummy data 01"
  });
  dummyTs.write({
    type: "dummy",
    name: "dummy02",
    value: "dummy data 02"
  });
}

//fujisawaの天気を取得してlindaに書き込み
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
