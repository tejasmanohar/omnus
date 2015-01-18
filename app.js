var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname + '/tmp'));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

var fs = require('fs');
var request = require('request');
var superagent = require('superagent');
var twilio = require('twilio');
var weather = require('weather');

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
  var body = req.body.Body;
  if(body.substring(0, 4) === 'play ') {
    function searchMusic(query, cb) {
      superagent
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

      search(body, function(url) {
        startCall(url);
      });

      res.send('success');
  } else if(body.substring(0, 7) === 'weather ') {
    weather({location: body.substring(8)}, function(data) {
      client.sendMessage({
        to: req.query.From,
        from: process.env.PHONE_NUMBER,
        body: data.temp
      }, function(err, responseData) {
        if (err) {
          res.send('success');
        } else {
          res.send('failure');
        }
      });
    });
  } else if (body.substring(0, 6) === 'scan qr') {
    scanQRCode(req.body.MediaUrl0, req.body.From);
    res.send('success');
  } else if (req.body.Body.substring(0, 6) === 'make qr') {
    createQRCode(req.body.Body.substring(4), req.body.From);
    res.send('success');
  }

});

app.post('/xml/:id', function(req, res) {
  res.set('Content-Type', 'text/xml');
  res.send('<Response><Play>' + baseUrl + '/' + req.params.id + '.mp3' + '</Play><Redirect/></Response>');
});



function scanQRCode(img_url, to_phone) {
    // console.log(req.body.MediaUrl0);
    request('http://api.qrserver.com/v1/read-qr-code/?fileurl='+img_url, function(err, response, body) {
      data = JSON.parse(body);
      console.log(JSON.stringify(body));
      // var decodedVal = ;
      console.log(data[0].symbol[0].data);

      client.sms.messages.create({
          to:to_phone,
          from:PHONE_NUMBER,
          body:data[0].symbol[0].data
      }, function(error, message) {
          // The HTTP request to Twilio will run asynchronously. This callback
          // function will be called when a response is received from Twilio
          // The "error" variable will contain error information, if any.
          // If the request was successful, this value will be "falsy"
          if (!error) {
              // The second argument to the callback will contain the information
              // sent back by Twilio for the request. In this case, it is the
              // information about the text messsage you just sent:
              console.log('Success! The SID for this SMS message is:');
              console.log(message.sid);
       
              console.log('Message sent on:');
              console.log(message.dateCreated);
          } else {
              console.log('Oops! There was an error.');
          }
      });
      
    });
}



function createQRCode(messageB, to_phone) {
 
    client.messages.create({
        body: "",
        to: to_phone,
        from: PHONE_NUMBER,
        mediaUrl: "https://api.qrserver.com/v1/create-qr-code/?data="+ encodeURIComponent((messageB).trim()) +"&size=100x100&margin=10"
    }, function(err, message) {
      console.log(err);
        // process.stdout.write(message.sid);
    });
}


