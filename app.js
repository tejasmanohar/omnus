var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/tmp'));
app.use(bodyParser.urlencoded({
  extended: true
}));

var request = require('superagent');
var twilio = require('twilio');

require('shelljs/global');
var client = new twilio.RestClient(process.env.TWILIO_AUTH_SID, process.env.TWILIO_AUTH_TOKEN);

var port = process.env.PORT || 3000;
server.listen(port);
console.log('Listening at port: ' + port);

app.post('/incoming', function(req, res) {
  searchMusic(req.body.Body, function(url) {
    startCall(url, req.body.From);
  });
});

app.post('/xml/:id', function(req, res) {
  res.set('Content-Type', 'text/xml');
  res.send('<Response><Play>' + process.env.BASE_URL + '/' + req.params.id + '.mp3' + '</Play><Redirect/></Response>');
});

function startCall(url, recipient) {
  if (exec('youtube-dl --extract-audio --prefer-ffmpeg --audio-format mp3 --audio-quality 0 -o "tmp/%(id)s.%(ext)s" ' + url).code === 0) {
    var call = client.calls.create({
      to: recipient,
      from: process.env.PHONE_NUMBER,
      url: process.env.BASE_URL + '/xml/' + url.substring(url.length - 11)
    });
  }
}

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
