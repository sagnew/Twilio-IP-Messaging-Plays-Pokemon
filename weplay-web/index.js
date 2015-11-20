
var browserify = require('browserify-middleware');
var mustache = require('mustache-express');
var express = require('express');
var app = express();
var AccessToken = require('twilio').AccessToken;
var IpMessagingGrant = AccessToken.IpMessagingGrant;

var port = process.env.WEPLAY_PORT || 3002;

var redis = require('./redis')();

process.title = 'weplay-web';

app.listen(port);
console.log('listening on *:' + port);

app.engine('mustache', mustache());
app.set('views', __dirname + '/views');

if ('development' == process.env.NODE_ENV) {
  app.use('/main.js', browserify('./client/app.js'));
}
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next){
  req.socket.on('error', function(err){
    console.error(err.stack);
  });
  next();
});

var url = process.env.WEPLAY_IO_URL || 'http://localhost:3001';
app.get('/', function(req, res, next){
  redis.get('weplay:frame', function(err, image){
    if (err) return next(err);
    redis.get('weplay:connections-total', function(err, count){
      if (err) return next(err);
      res.render('index.mustache', {
        img: image.toString('base64'),
        io: url,
        connections: count
      });
    });
  });
});

app.get('/screenshot.png', function(req, res, next) {
  redis.get('weplay:frame', function(err, image){
    if (err) return next(err);
    res.writeHead(200, {
      'Content-Type':'image/png',
      'Content-Length': image.length});
    res.end(image);
  });
});

/*
Generate an Access Token for a chat application user - it generates a random
username for the client requesting a token, and takes a device ID as a query
parameter.
*/
app.get('/token', function(request, response) {
  console.log(request.query.identity);
  var appName = 'TwilioChatDemo';
  var identity = request.query.identity;
  var deviceId = request.query.device;

  // Create a unique ID for the client on their current device
  var endpointId = appName + ':' + identity + ':' + deviceId;

  // Create a "grant" which enables a client to use IPM as a given user,
  // on a given device
  var ipmGrant = new IpMessagingGrant({
    serviceSid: process.env.TWILIO_IPM_SERVICE_SID,
      endpointId: endpointId
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  var token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
    );
  token.addGrant(ipmGrant);
  token.identity = identity;

  // Serialize the token to a JWT string and include it in a JSON response
  response.send({
    identity: identity,
    token: token.toJwt()
  });
});
