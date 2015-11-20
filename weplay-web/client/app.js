/*global URL,config*/

/* dependencies */
var $ = require('jquery');
var io = require('socket.io-client');
var blobToImage = require('./blob');
var censor = require('./censor');

// Manages the state of our access token we got from the server
var accessManager;

// Our interface to the IP Messaging service
var messagingClient;

// A handle to the "general" chat channel - the one and only channel we
// will have in this sample app
var generalChannel;

// resize asap before loading other stuff
function resize(){
  if ($(window).width() <= 500) {
    $('#chat, #game').css('height', $(window).height() / 2);
    $('.input input').css('width', $(window).width() - 40);
    $('.messages').css('height', $(window).height() / 2 - 70);
  } else {
    $('#chat, #game').css('height', $(window).height());
    $('.input input').css('width', $('.input').width());
    $('.messages').css('height', $('#chat').height() - 70);
  }
  scrollMessages();
}
$(window).resize(resize);
resize();

// reset game img size for mobile now that we loaded
$('#game img').css('height', '100%');

var socket = io(config.io);
socket.on('connect', function(){
  $('body').addClass('ready');
  $('.messages').empty();
  $('.messages').removeClass('connecting');
  $('.messages').addClass('connected');
  $('.input').removeClass('connecting');
  $('.input').addClass('connected');
  $('.input form input').attr('placeholder', 'enter your name to play');
  $('.input form input').attr('disabled', false);
  message('Welcome to Twilio IP Messaging Plays Pokemon!');
  message('This is a Twitch Plays Pokemon clone built by @Sagnewshreds using the new IP Messaging API.');
  message('Enter the following commands in the chat to play the game:');
  message('["left", "right", "up", "down", "a", "b", "start", "select"]');
  message('Note: Try this in Chrome or Firefox for best results.');
  if (window.localStorage && localStorage.nick) {
    join(localStorage.nick);
  }
});

socket.on('disconnect', function(){
  message('Disconnected. Reconnecting.');
});

if ('ontouchstart' in window) {
  $('body').addClass('touch');
}

var joined = false;
var input = $('.input input');
var nick;
var gbButtons = ['left', 'right', 'up', 'down', 'a', 'b', 'start', 'select'];
$('.input form').submit(function(ev){
  ev.preventDefault();
  var enteredText = input.val();
  enteredText = censor(enteredText);
  if ('' === enteredText) return;
  input.val('');
  if (joined) {
    if (gbButtons.indexOf(enteredText.toLowerCase()) !== -1) {
      generalChannel.sendMessage(enteredText);
      socket.emit('move', enteredText);
    } else if (enteredText.toLowerCase() === 'up up down down left right left right b a start') {
      // Special surprise.
      konamiCode();
      message(nick, 'This player is currently cheating');
    } else {
      generalChannel.sendMessage(enteredText);
    }
  } else {
    join(enteredText);
  }
});

function join(data){
  nick = data;
  // Try-catch necessary because Safari might have locked setItem causing
  // exception
  try {
    if (window.localStorage) localStorage.nick = data;
  } catch (e) {}
  $('body').addClass('joined');
  $('.input').addClass('joined');
  input
  .attr('placeholder', 'type in to chat')
  .blur();
  joined = true;

  // If the IP Messaging channel doesn't exist yet, initialize it.
  if(!generalChannel) {
    initializeChat();
  }
}

input.focus(function(){
  $('body').addClass('input_focus');
});

input.blur(function(){
  $('body').removeClass('input_focus');
});

socket.on('joined', function(){
  $('.messages').append(
    $('<p>').text('You have joined.').append($('<span class="key-info"> Keys are as follows: </span>'))
    .append(
    $('<table class="keys">').append(
      $('<tr><td>left</td><td>←</td>'),
      $('<tr><td>right</td><td>→</td>'),
      $('<tr><td>up</td><td>↑</td>'),
      $('<tr><td>down</td><td>↓</td>'),
      $('<tr><td>A</td><td>a</td>'),
      $('<tr><td>B</td><td>s</td>'),
      $('<tr><td>select</td><td>o</td>'),
      $('<tr><td>start</td><td>enter</td>')
    ))
    .append('<br><span class="key-info">Make sure the chat input is not focused to perform moves.</span><br> '
      + 'Input is throttled server side to prevent abuse. Catch \'em all!')
  );

  $('table.unjoined').removeClass('unjoined');
  scrollMessages();
});

var map = {
  37: 'left',
  39: 'right',
  65: 'a',
  83: 'b',
  66: 'b',
  38: 'up',
  40: 'down',
  79: 'select',
  13: 'start'
};

var reverseMap = {};
for (var i in map) reverseMap[map[i]] = i;

// Allows user to control the game without chat.
function konamiCode () {
  alert('You think you\'re clever huh? You have 5 minutes');
  console.log('Konami code entered!');
  $(document).on('keydown', function(ev){
    if (null == nick) return;
    var code = ev.keyCode;
    if ($('body').hasClass('input_focus')) return;
    if (map[code]) {
      ev.preventDefault();
      socket.emit('move', map[code]);
    }
    window.setTimeout(function () {
      $(document).on('keydown', function() {});
    }, 300000);
  });
}

// Listener to fire up keyboard events on mobile devices for control overlay
$('table.screen-keys td').mousedown(function() {
  var id = $(this).attr('id');
  var code = reverseMap[id];
  var e = $.Event('keydown');
  e.keyCode = code;
  $(document).trigger(e);

  $(this).addClass('pressed');
  var self = this;
  setTimeout(function() {
    $(self).removeClass('pressed');
  }, 1000);
});

socket.on('connections', function(total){
  $('.count').text(total);
});

socket.on('join', function(nick, loc){
  var p = $('<p>');
  p.append($('<span class="join-by">').text(nick));
  if (loc) {
    p.append(' (' + loc + ')');
  }
  p.append(' joined.');
  $('.messages').append(p);
  trimMessages();
  scrollMessages();
});

// Uncomment the following listener to allow users to control the game without using the chat.
//socket.on('move', function(move, by){
//  var p = $('<p class="move">').text(' pressed ' + move);
//  p.prepend($('<span class="move-by">').text(by));
//  $('.messages').append(p);
//  trimMessages();
//  scrollMessages();
//});

socket.on('reload', function(){
  setTimeout(function(){
    location.reload();
  }, Math.floor(Math.random() * 10000) + 5000);
});

function message(msg, by){
  var p = $('<p>').text(msg);
  if (by) {
    p.prepend($('<span class="message-by">').text(by + ': '));
  } else {
    p.addClass('server');
  }
  $('.messages').append(p);
  trimMessages();
  scrollMessages();
}

function trimMessages(){
  var messages = $('.messages');
  while (messages.children().length > 300) {
    $(messages.children()[0]).remove();
  }
}

function scrollMessages(){
  $('.messages')[0].scrollTop = 10000000;
}

var image = $('#game img')[0];
var lastImage;
socket.on('frame', function(data){
  if (lastImage && 'undefined' != typeof URL) {
    URL.revokeObjectURL(lastImage);
  }
  image.src = blobToImage(data);
  lastImage = image.src;
});

// Highlights controls when image or button pressed
function highlightControls() {
  $('table.screen-keys td:not(.empty-cell)').addClass('highlight');

  setTimeout(function() {
    $('table.screen-keys td').removeClass('highlight');
  }, 300);
}

$('img').mousedown(highlightControls);
$('table.screen-keys td').mousedown(highlightControls);

function initializeChat() {
  // Get an access token for the current user, passing a username (identity)
  // and a device ID - for browser-based apps, we'll always just use the
  // value "browser"
  $.getJSON('/token', {
    identity: nick,
    device: 'browser'
  }, function(data) {
    // Initialize the IP messaging client
    accessManager = new Twilio.AccessManager(data.token);
    messagingClient = new Twilio.IPMessaging.Client(accessManager);

    // Get the general chat channel, which is where all the messages are
    // sent in this simple application
    var promise = messagingClient.getChannelByUniqueName('general');
    promise.then(function(channel) {
      generalChannel = channel;
      if (!generalChannel) {
        // If it doesn't exist, let's create it
        messagingClient.createChannel({
          uniqueName: 'general',
          friendlyName: 'General Chat Channel'
        }).then(function(channel) {
          console.log('Created general channel:');
          console.log(channel);
          generalChannel = channel;
          setupChannel();
        });
      } else {
        console.log('Found general channel:');
        console.log(generalChannel);
        setupChannel();
      }
    });
  });
}

// Set up channel after it has been found
function setupChannel() {
  // Join the general channel
  generalChannel.join().then(function(channel) {
    // Listen for new messages sent to the channel
    generalChannel.on('messageAdded', function(newMessage) {
      message(newMessage.body, newMessage.author);
    });
  });

}
