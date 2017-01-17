var Sonos = require('sonos')

console.log('Searching for Sonos devices...')
var search = Sonos.search();
var h = "";
var p = 0;

search.on('DeviceAvailable', function (device, model) {
  //console.log(device, model)
  var sonos = new Sonos.Sonos(process.env.SONOS_HOST || device.host, process.env.SONOS_PORT || device.port);
  sonos.currentTrack(function (err, track) {
    //console.log(err, track);
    console.log(track.title);
    console.log(track.artist);
    console.log(track.album);
    console.log(track.albumArtURI);
  });
})

// Optionally stop searching and destroy after some time
setTimeout(function () {
  console.log('Stop searching for Sonos devices');
  search.destroy();
}, 1000);
