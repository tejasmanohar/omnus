var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.static(__dirname + '/tmp'));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));

var fs = require('fs');
var request = require('request');
var superagent = require('superagent');
var translate = require('yandex-translate');
var twilio = require('twilio');
var weather = require('weather-js');
var wit = require('node-wit');

var ACCESS_TOKEN = process.env.WIT_TOKEN;


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

    wit.captureTextIntent(ACCESS_TOKEN, body, function (err, res) {
      console.log("Response from Wit for text input: ");
      if (err) console.log("Error: ", err);
      console.log(JSON.stringify(res, null, " "));
  });



  if(body.substring(0, 4).toLowerCase() === 'play') {
    // var songs = (body.substring(4).split(',')[];

    for (var i =0; i<songs.length; i++) {
      searchMusic(body.substring(4), function(url) {
        startCall(url, req.body.From);
      });
    }

    


    res.send('success');
  } else if(body.substring(0, 7).toLowerCase() === 'weather') {
      weather.find({search: body.substring(8), degreeType: 'F'}, function(err, result) {
        if(err) {
          console.log(err);
        } else {
          client.sms.messages.create({
              to: req.body.From,
              from: process.env.PHONE_NUMBER,
              body: result[0].current.temperature + '° Fahrenheit'
          }, function(error, message) {
              if (error) {
                console.log(error);
              } else {
                console.log(message)
              }
          });
        }
      });
    } else if (body.substring(0, 7).toLowerCase() === 'scan qr') {
      scanQRCode(req.body.MediaUrl0, req.body.From);
      res.send('success');
    } else if (req.body.Body.substring(0, 11).toLowerCase() === 'generate qr') {
      createQRCode(req.body.Body.substring(11), req.body.From);
      res.send('success');
    } else if (req.body.Body.substring(0, 9).toLowerCase() === 'translate') {
      var lang = req.body.Body.substring(10, 12);
      console.log(lang); 
          
      var credentials = {
        clientId: process.env.BING_CLIENT_ID,     /* Client ID from the registered app */
        clientSecret: process.env.BING_CLIENT_SECRET  /* Client Secret from the registered app */
      }
      var translator = require('bingtranslator');

      var text = req.body.Body.substring(13);
      console.log(text);

      translator.detect(credentials, text, detectCb);

      function detectCb(err, from) {
        if (err) {
          console.log('error', err);
          return;
        }

        translator.translate(credentials, text, from, lang, translateCb);
      }

      function translateCb(err, translated) {
        if (err) {
          console.log('error', err);
          return;
        }

        console.log(translated);

        client.sms.messages.create({
            to: req.body.From,
            from: process.env.PHONE_NUMBER,
            body:translated
        }, function(error, message) {
            if (!error) {
              console.log('Success! The SID for this SMS message is:');
              console.log(message.sid);
       
              console.log('Message sent on:');
              console.log(message.dateCreated);
            } else {
              console.log('Oops! There was an error.');
            }
        });

        res.send("Completed translation");
      }



      // translate(req.body.Body.substring(14), { to: lang }, function(err, res) {
      //       console.log(res);
      //     });
    }
});

app.post('/xml/:id', function(req, res) {
  res.set('Content-Type', 'text/xml');
  res.send('<Response><Play>' + baseUrl + '/' + req.params.id + '.mp3' + '</Play><Redirect/></Response>');
});

function startCall(url, recipient) {
  if (exec('youtube-dl --extract-audio --prefer-ffmpeg --audio-format mp3 --audio-quality 0 -o "tmp/%(id)s.%(ext)s" ' + url).code === 0) {
    var call = client.calls.create({
      to: recipient,
      from: process.env.PHONE_NUMBER,
      url: baseUrl + '/xml/' + url.substring(url.length - 11)
    });
  }
}

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

function scanQRCode(img_url, recipient) {
    request('http://api.qrserver.com/v1/read-qr-code/?fileurl='+img_url, function(err, response, body) {
      data = JSON.parse(body);
      console.log(data)
      console.log(JSON.stringify(body));
      console.log(data[0].symbol[0].data);

      client.sms.messages.create({
          to: recipient,
          from: process.env.PHONE_NUMBER,
          body:data[0].symbol[0].data
      }, function(error, message) {
          if (!error) {
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




function createQRCode(messageB, recipient) {
 
    client.messages.create({
        body: '',
        to: recipient,
        from: process.env.PHONE_NUMBER,
        mediaUrl: "https://api.qrserver.com/v1/create-qr-code/?data="+ encodeURIComponent((messageB).trim()) +"&size=100x100&margin=10"
    }, function(err, message) {
      console.log(err);
    });
}


