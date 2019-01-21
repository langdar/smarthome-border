#!/usr/bin/env node
var WebSocketClient = require('websocket').client;
const OpenWeatherMapHelper = require("openweathermap-node");
var client = new WebSocketClient();
var iUrl = '';
var iD = '';
var iA = '';
var iT = '';
var t = 0.0;
var h = 0.0;
var c = 0;
const helper = new OpenWeatherMapHelper(
    {
        APPID: '318d50e231c1a63964b5852dc8e5c9ea',
        units: "metric",
        lang: "de"
    }
);

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.sendUTF("OWM - Pirna");
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
		helper.getCurrentWeatherByCityName("Pirna, DE", (err, currentWeather) => {
    		if(err){
        		console.log(err);
    		}
    		else{
                console.log(currentWeather);
			    console.log(currentWeather.main.temp);
                h = currentWeather.main.humidity;
                t = currentWeather.main.temp;
                //iUrl = "http://openweathermap.org/img/w/"+currentWeather.weather[0].icon+".png";
                console.log(iUrl);
                //h = weather.main.humidity;
    		}
		});
		helper.getThreeHourForecastByCityName("Pirna, DE", (err, threeHourForecast) => {
            if(err){
                console.log(err);
            }	
            else{
                console.log(threeHourForecast.list[0]);
                console.log(threeHourForecast.list[0].dt_txt);
                iUrl = "http://openweathermap.org/img/w/"+threeHourForecast.list[0].weather[0].icon+".png";
                iD = threeHourForecast.list[0].dt_txt;
                iA = threeHourForecast.list[0].main.temp_min;
            }
		});
          c=0;
	}
            var o = {
              time: (new Date()),
              sensor: "OWM - Pirna",
              temp: t,
              humidity: h
            }
            //console.log(o);
            connection.sendUTF(JSON.stringify({ type: 'SensorTherm', data: o }));
            
            o = {
                t: iT,
                a: iA,
                al: iD,
                aa: iUrl
            }
            connection.sendUTF(JSON.stringify({ type: 'ForeCast', data: o }));
            c++;
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});

client.connect('ws://localhost:1337/', null);
