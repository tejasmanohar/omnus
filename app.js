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
var randomWord = require('random-word');
var request = require('request');
var superagent = require('superagent');
var translate = require('yandex-translate');
var twilio = require('twilio');
var weather = require('weather-js');
var wit = require('node-wit');

require('shelljs/global');
var parseString = require('xml2js').parseString;
var client = new twilio.RestClient(process.env.TWILIO_AUTH_SID, process.env.TWILIO_AUTH_TOKEN);

var port = process.env.PORT || 3000;
server.listen(port);
console.log('Listening at port: ' + port);

app.post('/incoming', function(req, res) {
  var body = req.body.Body;
  console.log(body.indexOf('to') > 0 && body.split(' ').length >= 3);
  console.log(body)
  var intent;

  var data;

  wit.captureTextIntent(process.env.WIT_TOKEN, body, function (err, res1) {
    if (err) console.log("Error: ", err);
    data = res1;
    console.log(JSON.stringify(res1))
    intent = res1.outcomes[0].intent;
    console.log(intent)
    
    if(body.substring(0,6).toLowerCase() === 'define') {
        superagent
          .get('http://www.dictionaryapi.com/api/v1/references/collegiate/xml/' + body.substring(7) + '?key=' + process.env.KEY_DICTIONARY)
          .end(function(err, resultz) {
          if(err) {
            console.log(err);
          } else {
            console.log(resultz.text)
            var xml = resultz.text;
            parseString(xml, function (err, resultzz) {
              console.log(resultzz);
              console.log(resultzz.def.dt);
              client.sms.messages.create({
                to: req.body.From,
                from: process.env.PHONE_NUMBER,
                body: resultzz.def.dt
              }, function(error, message) {
                if (error) {
                  console.log(error)
                } else {
                  console.log('success')
                }
              });
            });
          }
        })
    } else if(body.indexOf('to') > 0 && body.split(' ').length >= 3 && /^[a-z0-9]+$/i.test(body.charAt(0))) {
      var origin = body.substring(0, body.indexOf('to'))
      var destination = body.substring(body.indexOf('to'))

      console.log(origin + ' to ' + destination)
      superagent
        .get('https://maps.googleapis.com/maps/api/directions/json?origin=' + encodeURIComponent(origin) + '&destination=' + encodeURIComponent(destination))
        .end(function(err, res) {
          if(err) {
            console.log(err);
          } else {
            var data = JSON.parse(res.text);
            var resulting = [].concat.apply([], data.routes.map(function(route) {
              return [].concat.apply([], route.legs.map(function(leg) {
                return leg.steps.map(function(step) {
                  return step.html_instructions;
                });
              }));
            })).join("\n");
            resulting = replaceAll('<b>', '', resulting)
            resulting = replaceAll('</b>', '', resulting)
            resulting = replaceAll('<span>', '', resulting)
            resulting = replaceAll('</span>', '', resulting)
            resulting = replaceAll('<div>', '', resulting)
            resulting = replaceAll('</div>', '', resulting)
            console.log(resulting);
            var resultingArr = resulting.match(/.{1,160}/g);
            for(var i = 0; i < resultingArr.length; i++) {
              client.sms.messages.create({
                to: req.body.From,
                from: process.env.PHONE_NUMBER,
                body: resultingArr[i]
              }, function(error, message) {
                if (error) {
                  console.log(error)
                } else {
                  console.log('success')
                }
              });
            }
          }
        })

    res.send('success');
  } else if(intent === 'weather') {
    console.log('9')
      weather.find({search: data.outcomes[0].entities.city[0].value, degreeType: 'F'}, function(err, result) {
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
    } else if (intent === 'translate') {
      console.log('10')
      var lang = data.outcomes[0].entities.language[0].value;
      console.log(lang);

      var credentials = {

        clientId: process.env.BING_CLIENT_ID,     /* Client ID from the registered app */
        clientSecret: process.env.BING_CLIENT_SECRET  /* Client Secret from the registered app */

      }
      var translator = require('bingtranslator');

      var text = data.outcomes[0].entities.text[0].value;
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
    } else if(intent === 'play') {
      searchMusic(data.outcomes[0].entities.song_name[0].value, function(url) {
        startCall(url, req.body.From);
      });
    } else if(body.toLowerCase() === 'random') {
      client.sms.messages.create({
      to: req.body.From,
      from: process.env.PHONE_NUMBER,
      body: randomWord()
      }, function(error, message) {
          if (error) {
            console.log(error)
          } else {
            res.send('complete')
          }
    });
    } else {
      client.sms.messages.create({
        to: req.body.From,
        from: process.env.PHONE_NUMBER,
        body: "sorry, i do not understand"
    }, function(error, message) {
        if (error) {
          console.log(error)
        } else {
          res.send('complete')
        }
      });
    }
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

  function replaceAll(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
  }
