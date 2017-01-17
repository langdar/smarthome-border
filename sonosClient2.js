#!/usr/bin/env node
var WebSocketClient = require('websocket').client;
var Sonos = require('sonos');

var client = new WebSocketClient();
var artist = '';
var title = '';
var album = '';
var albumArt = '';
var host = '';
var port = 0;
var sonos;
var cSong;
var search = Sonos.search();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    search.on('DeviceAvailable', function (device, model) {
      host = device.host;
      port = device.port;
      sonos = new Sonos.Sonos(process.env.SONOS_HOST || device.host, process.env.SONOS_PORT || device.port);
    });
    connection.sendUTF("nodejs-Client");
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
            if (sonos) {
            sonos.currentTrack(function (err, track) {
                //console.log(err, track);
                artist = track.artist;
                title = track.title;
                album = track.album;
                albumArt = "http://"+host+":"+port+track.albumArtURI;
                //console.log(track.title);
                //console.log(track.artist);
                //console.log(track.album);
                //console.log(albumArt);
              });
            var o = {
              t: title,
              a: artist,
              al: album,
              aa: albumArt
            }
            if (JSON.stringify(o) != JSON.stringify(cSong)) {
              console.log("Songwechsel");
              console.log(o);
              connection.sendUTF(JSON.stringify({ type: 'Sonos', data: o }));
              cSong = o;
            }
          }
            setTimeout(sendNumber, 1000);
        }
    }
    sendNumber();
});

client.connect('ws://localhost:1337/', null);
