var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname + '/tmp'));
var bodyParser = require('body-parser');
app.use(bodyParser());

var async = require('async');
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

app.get('/', function(req, res) {
  res.sendStatus(200);
});

app.post('/phone-receive', function(req, res) {
  search(req.body.Body, function(url) {
    startCall(url);
  });

  function startCall(url) {
    if (exec('youtube-dl --extract-audio --prefer-ffmpeg --audio-format mp3 --audio-quality 9 -o "tmp/%(id)s.%(ext)s" ' + url).code === 0) {
      var call = client.calls.create({
        to: req.body.From,
        from: process.env.PHONE_NUMBER,
        url: baseUrl + '/xml/' + url.substring(url.length - 11)
      });
    }
  }

  res.sendStatus(200);
});

app.post('/app-receive', function(req, res) {
  search(req.body.Body, function(url) {
    startTransfer(url);
  });

  function startTransfer(url) {
    if (exec('youtube-dl --extract-audio --prefer-ffmpeg --audio-format mp3 --audio-quality 9 -o "tmp/%(id)s.%(ext)s" ' + url).code === 0) {
      fs.readFile('tmp/' + url.substring(url.length - 11) + '.mp3', function(err, data) {
        var str = data.toString('base64');
        for(var i = 0; i < str.length; i += 3000) {
          client.sendMessage({
              to: req.body.From,
              body: '',
              mediaUrl: 'http://api.qrserver.com/v1/create-qr-code/?data=' + str.substring(i, Math.min(str.length, i + 3000)),
              from: process.env.APP_NUMBER,
            }, function(err, messageData) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(messageData.status);
                }
            });
        }
      });
    }
  }

  res.send('complete');
});

app.post('/xml/:id', function(req, res) {
  res.set('Content-Type', 'text/xml');
  res.send('<Response><Play>' + baseUrl + '/' + req.params.id + '.mp3' + '</Play><Redirect/></Response>');
});

function search(query, cb) {
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
