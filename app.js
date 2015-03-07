var dotenv = require('dotenv');
dotenv.load();

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
  startCall(req.body.Body, req.body.From);
  res.sendStatus(200);
});

app.post('/xml/:id', function(req, res) {
  res.set('Content-Type', 'text/xml');
  res.send('<Response><Play>' + process.env.BASE_URL + '/' + req.params.id + '.mp3' + '</Play><Redirect/></Response>');
});

function startCall(search, recipient) {
  exec("youtube-dl --extract-audio --prefer-ffmpeg --audio-format mp3 --audio-quality 0 -o \"tmp/" + search + ".%(ext)s\" \"ytsearch:" + search + "\"");
  exec('sleep 30');
  var call = client.calls.create({
    to: recipient,
    from: process.env.PHONE_NUMBER,
    url: process.env.BASE_URL + '/xml/' + search
  });
}
