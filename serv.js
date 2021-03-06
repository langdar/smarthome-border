var server = require('websocket').server, http = require('http');
var history = [ ];
var clients = [ ];
var r = require('rethinkdb');
var db_da = false;

/**
 * Verbinden wir uns doch erst mal zur Rethinkdb-Instanz auf localhost
 * Wenn das geht, schreiben wir sp�ter alle Daten da rein und holen uns den aktuellsten wert jeweils aus der Datenbank
 * sonst geben wir alles direkt weiter
 */
var rcon = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) {
        console.log('Keine Datenbank gestartet, wir arbeiten ohne...');
    } else {
        console.log('Connected to rethinkdb@localhost');
        rcon = conn;
        /*Wenn unsere Datenbank da ist, ist alles gut, sonst wird sie angelegt*/
        r.dbList().contains('SmartHome')
            .do(function (databaseExists) {
                return r.branch(
                    databaseExists,
                    { dbs_created: 0 },
                    r.dbCreate('SmartHome')
                );
            }).run(rcon, function (err, result) {
                if (err) throw err;
                //console.log(JSON.stringify(result, null, 2));
            });
        /*Wenn unsere Temperaturtabelle da ist, ist alles gut, sonst wird sie angelegt*/
        r.db('SmartHome').tableList().contains('Temps')
            .do(function (tableExists) {
                return r.branch(
                    tableExists,
                    { dbs_created: 0 },
                    r.db('SmartHome').tableCreate('Temps')
                );
            }).run(rcon, function (err, result) {
                if (err) throw err;
                //console.log(JSON.stringify(result, null, 2));
            });
        db_da = true;
        console.log('Wir arbeiten mit ner Datenbank :-)');
    }
});



function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var colors = [ 'red', 'green', 'blue', 'mangenta', 'purple', 'plum', 'orange'];
colors.sort(function(a,b) { return Math.random() > 0.5; });

var socket = new server({
    httpServer: http.createServer().listen(1337, function () {
        console.log((new Date()) + ' Server started on port 1337 and waiting for connections...');
    })
});

socket.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connection = request.accept(null, request.origin);
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
          if (userName === false) {
            userName = htmlEntities(message.utf8Data);
            userColor = colors.shift();
            connection.sendUTF(JSON.stringify({ type:'color', data: userColor}));
            console.log((new Date()) + ' User is known as: ' + userName + ' with '+ userColor + ' color.');
          } else {
            //console.log(message.utf8Data);
            var o = JSON.parse(message.utf8Data);
            console.log((new Date()) + o.type);
            //console.log(o);
            if (o.type == "Message") {
              var obj = {
                time: (new Date()).getTime(),
                text: htmlEntities(o.data),
                author: userName,
                color: userColor
              };
              var json = JSON.stringify({ type: 'message', data: obj });
              for (var i=0; i < clients.length; i++) {
                clients[i].sendUTF(json);
              }
            } else if (o.type == "SensorTherm") {
                var json = JSON.stringify({ type: 'SensorTherm', data: o.data });
		//o.data.temp = o.data.temp.toFixed(1);
                if (db_da) {
                    r.db('SmartHome').table('Temps').insert(o.data).run(rcon, function (err, result) {
                        if (err) throw err;
                        //console.log(JSON.stringify(result, null, 2));
                    });
                }
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
                console.log("Sensordata send");
            } else if (o.type == "Sonos") {
                var json = JSON.stringify({type: 'Sonos', data: o.data});
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
                console.log("Sonos data send...");
            } else if (o.type == "ForeCast") {
                var json = JSON.stringify({type: 'ForeCast', data: o.data});
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
                console.log("Forecast data send...");
            } else if (o.type == "Fake") {
                var json = JSON.stringify({ type: 'Fake', data: o.data });
                if (db_da) {
                    r.db('SmartHome').table('Temps').insert(o.data).run(rcon, function (err, result) {
                        if (err) throw err;
                        //console.log(JSON.stringify(result, null, 2));
                    });
                    r.db('SmartHome').table('Temps').orderBy(r.desc('time')).limit(1).run(rcon, function (err, result) {
                        console.log(result);
                        json = JSON.stringify({ type: 'Fake', data: result });
                        console.log(json);
                    });
                }
                for (var i = 0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
                console.log("Fake data send");
            }
          }
        }
    });
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
          console.log((new Date()) + 'Peer ' + connection.remoteAddress + ' disconnected.');
          clients.splice(index, 1);
          colors.push(userColor);
        }
    });
});
