var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname + '/tmp'));
var bodyParser = require('body-parser');
app.use(bodyParser());

var async = require('async');
var request = require('superagent');
var twilio = require('twilio');

require('shelljs/global');

var client = new twilio.RestClient(process.env.AUTH_SID, process.env.AUTH_TOKEN);

var port = process.env.PORT || 3000;
server.listen(port);
console.log('Listening at port: ' + port);

if(process.env.NODE_ENV === 'PRODUCTION') {
  var baseUrl = 'domain.com';
} else {
  var baseUrl = 'localhost:' + port;
}

app.get('/', function(req, res) {
  res.sendStatus(200);
});

app.all('/receive', function(req, res) {
  var searchSong = req.body.Body;

  search(searchSong, function(url) {
    startCall(url);
  });
  
  function startCall(url) {
    var call = client.calls.create({
      to: req.body.From,
      from: process.env.NUMBER,
      url: baseUrl + '/xml/' + url
    });
    exec('youtube-dl --extract-audio --prefer-ffmpeg --audio-format mp3 -o "tmp/%(id)s.%(ext)s"' + url);
  }

  res.sendStatus(200);
});

app.post('/xml/:id', function(req, res) {
  res.set('Content-Type', 'text/xml');
  res.send('<Response><Play>' + baseUrl + req.params.id + '.mp3' + '</Play><Redirect/></Response>');
});

function search(query, cb) {
  request
    .get('http://partysyncwith.me:3005/search/'+ query +'/1')
    .end(function(err, res) {
      if(err) {
        return err;
      } else {
        if (typeof JSON.parse(res.text).data !== 'undefined') {
            if (JSON.parse(res.text).data[0].duration < 600) {
              var url = JSON.parse(res.text).data[0].video_url;
              cb(url);
           } else {
              cb(null);
           }
        }        
      }
    })
}
