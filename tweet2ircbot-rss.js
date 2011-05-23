var sys = require('sys');
var u = require('url')
var http = require('http');
var https = require('https');
var irc = require('./irc');

var feed = 'RSSURL';
var channel = '#CHANNEL';
var server = 'SERVER';
var name = 'NAME';
var title = '';

var bot = new irc.Client(server, name, {
  debug: true,
  password: 'PASSWORD',
  channels: [channel]
});

bot.addListener('error', function(message) {
  console.log('ERROR: ' + message.command + ': ' + message.args.join(' '));
});

function shorter(longurl, callback) {
  var options = {
    host: 'www.googleapis.com',
    port: 443,
    path: '/urlshortener/v1/url',
    headers: {'Content-Type': 'application/json'},
    method: 'POST'
  };
  var key = 'AIzaSyDXjrXrqpwBUmnhsL8s7DnD5GSHWQKYXbk';

  var req = https.request(options, function(res) {
    var data = '';
    res.on('data', function(d) {
      data += d;
      callback(data);
    });
    res.on('error', function(e) {
      console.error(e);
    });
  })

  var payload = '{"longUrl":"' + longurl + '", "key":"' + key + '"}';
  req.write(payload);
  req.end();
}

function fetchURL(url, callback) {
  var parts = u.parse(url);
  if(!parts.port) { parts.port = 80; }
  var client = http.createClient(parts.port, parts.hostname);
  client.on('error', function(e) {
    console.log(e);
  });
  var request = client.request('GET', parts.pathname, {'host': parts.hostname});
  request.addListener('response', function (response) {
    switch(response.statusCode) {
    case 200:
      var body = ''; 
      response.addListener('data', function (chunk) {
        body += chunk;
      });
      response.addListener('end', function() {
        console.log('Done.');
        callback(body);
      });
      break;
    default:
      break;
    }
  });
  request.end();
}

function fetchFeed() {
  fetchURL(feed, function(body) {
    var sys = require('sys');
    var xml2js = require('./xml2js');
    var parser = new xml2js.Parser();
    parser.addListener('end', function(result) {
      //console.log(sys.inspect(result));
      //console.log(result['@']);
      //console.log(result['channel']['item'][0]['title']);
      //console.log(result['channel']['item'][0]['link']);
      if (title == result['channel']['item'][0]['title']) {
        console.log("same message");
      } else {
        title = result['channel']['item'][0]['title'];
        //bot.say(channel, title);
        shorter(result['channel']['item'][0]['link'],
              function(data) {
                //console.log(data);
                eval("obj="+data);
                //console.log(obj['id']);
                bot.say(channel, title + ' ' + obj['id']);
              });
      }
    });
    parser.parseString(body);
  });
}

var timer = setInterval(fetchFeed, 60000);
