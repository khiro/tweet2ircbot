var sys = require('sys');
var https = require('https');
var u = require('url')
var irc = require('./irc');
var twitternode = require('./twitter-node');

var id = ID;
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

var twit = new twitternode.TwitterNode({
  user: 'USER',
  password: 'PASSWORD',
  follow: [id],                  // follow these random users
});

twit.addListener('error', function(error) {
  console.log(error.message);
});


twit.addListener('tweet', function(tweet) {
    if (tweet.user.id == id) {
      link = 'http://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
      tweet_text = tweet.user.screen_name + ": " + tweet.text;
      shorter(link, function(data) {
        eval("obj="+data);
        bot.say(channel, tweet_text + ' ' + obj['id']);
      });
      //sys.puts(tweet.user.screen_name + ": " + tweet.text);
    } else {
      sys.puts("TWEET: " + tweet.user.screen_name);
    }
  });

twit.addListener('limit', function(limit) {
    sys.puts("LIMIT: " + sys.inspect(limit));
  });

twit.addListener('delete', function(del) {
    sys.puts("DELETE: " + sys.inspect(del));
  });

twit.addListener('end', function(resp) {
    sys.puts("wave goodbye... " + resp.statusCode);
    twit.stream();
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

twit.stream();
