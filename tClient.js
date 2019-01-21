#!/usr/bin/env node
var WebSocketClient = require('websocket').client;
var sensor = require('node-dht-sensor');

var client = new WebSocketClient();
var t = 0.0;
var h = 0.0;
var c = 0;

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.sendUTF("Wohnzimmer");
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            //console.log("Received: '" + message.utf8Data + "'");
        }
    });

    function sendNumber() {
        if (connection.connected) {
          if (c >= 10) {
            sensor.read(11, 4, function(err, temperature, humidity) {
              if (!err) {
                console.log('temp: ' + temperature.toFixed(1) + '°C, ' +
                'humidity: ' + humidity.toFixed(1) + '%'
                );
              }
	            t = temperature-2;
	            h = humidity+20;
            });
            c = 0;
          }
            var o = {
              time: (new Date()),
              sensor: "Zentrale",
              temp: t,
              humidity: h
            }
            //console.log(o);
            connection.sendUTF(JSON.stringify({ type: 'SensorTherm', data: o }));
            c++;
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});

client.connect('ws://localhost:1337/', null);
