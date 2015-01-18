var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname + '/tmp'));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var fs = require('fs');
var request = require('superagent');
var twilio = require('twilio');

require('shelljs/global');

var client = new twilio.RestClient(process.env.TWILIO_AUTH_SID, process.env.TWILIO_AUTH_TOKEN);

var port = process.env.PORT || 3000;
server.listen(port);
console.log('Listening at port: ' + port);

if(process.env.NODE_ENV === 'PRODUCTION') {
  var baseUrl = 'domain.com';
} else {
  var baseUrl = 'http://46cfc4a8.ngrok.com';
}

app.post('/incoming', function(req, res) {
  if(req.body.Body.substring(0, 3) === 'play') {
    function searchMusic(query, cb) {
      request
      .get('http://partysyncwith.me:3005/search/'+ query +'/1')
      .end(function(err, res) {
        if(err) {
          console.log(err);
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

      function startCall(url) {
        if (exec('youtube-dl --extract-audio --prefer-ffmpeg --audio-format mp3 --audio-quality 0 -o "tmp/%(id)s.%(ext)s" ' + url).code === 0) {
          var call = client.calls.create({
            to: req.body.From,
            from: process.env.PHONE_NUMBER,
            url: baseUrl + '/xml/' + url.substring(url.length - 11)
          });
        }
      }

      search(req.body.Body, function(url) {
        startCall(url);
      }); 
  }

  res.sendStatus(200);
});

app.post('/xml/:id', function(req, res) {
  res.set('Content-Type', 'text/xml');
  res.send('<Response><Play>' + baseUrl + '/' + req.params.id + '.mp3' + '</Play><Redirect/></Response>');
});
