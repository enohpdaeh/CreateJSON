var LindaClient = require('linda').Client;
var socket = require('socket.io-client').connect('http://linda-server.herokuapp.com/');
var linda = new LindaClient().connect(socket);
var ts = linda.tuplespace('delta');
var name = "";
var temp_value = "";
var light_value = "";
var http = require('http'), fs = require('fs');
var Step = require("step");
var async = require("async");

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

linda.io.on('connect', function(){
  console.log('socket.io connect!!');
  first();
  setTimeout(function(){
    for(var i = 0; i < resArray.length; i++){
      lindaJOSN = lindaJOSN.concat(dQ + i.toString() + dQ + coron + dQ + resArray[i] + dQ + canma);
    }
    lindaJOSN = lindaJOSN.slice(0, -1);
    lindaJOSN = lindaJOSN.concat("}");
    console.log(lindaJOSN);
  }, 3000);
});

function first(){
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
