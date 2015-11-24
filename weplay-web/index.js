var browserify = require('browserify-middleware');
var mustache = require('mustache-express');
var express = require('express');
var app = express();

var port = process.env.WEPLAY_PORT || 3002;

var redis = require('./redis')();

process.title = 'weplay-web';

app.listen(port);
console.log('listening on *:' + port);

app.engine('mustache', mustache());
app.set('views', __dirname + '/views');

app.use('/main.js', browserify('./client/app.js'));
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
