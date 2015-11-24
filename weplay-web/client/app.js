// dependencies
var $ = require('jquery');
var io = require('socket.io-client');
var blobToImage = require('./blob');
var chat = require('./chat');

// Global variables
var socket = io(config.io);
var joined = false;
var input = $('.input input');
var nick;
var image = $('#game img')[0];
var lastImage;
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

// Global functions:

// resize asap before loading other stuff
function resize() {
  if ($(window).width() <= 500) {
    $('#chat, #game').css('height', $(window).height() / 2);
    $('.input input').css('width', $(window).width() - 40);
    $('.messages').css('height', $(window).height() / 2 - 70);
  } else {
    $('#chat, #game').css('height', $(window).height());
    $('.input input').css('width', $('.input').width());
    $('.messages').css('height', $('#chat').height() - 70);
  }
}

function join(data) {
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
  if(!chat.channel) {
    chat.initializeChat(nick);
  }
}

// Highlights controls when image or button pressed
function highlightControls() {
  $('table.screen-keys td:not(.empty-cell)').addClass('highlight');

  setTimeout(function() {
    $('table.screen-keys td').removeClass('highlight');
  }, 300);
}

// Resize the window right away
$(window).resize(resize);
resize();

// reset game img size for mobile now that we loaded
$('#game img').css('height', '100%');

// Socket.io event listeners
socket.on('connect', function() {
  $('body').addClass('ready');
  $('.messages').empty();
  $('.messages').removeClass('connecting');
  $('.messages').addClass('connected');
  $('.input').removeClass('connecting');
  $('.input').addClass('connected');
  $('.input form input').attr('placeholder', 'enter your name to play');
  $('.input form input').attr('disabled', false);
  chat.printMessage('Welcome to Twilio IP Messaging Plays Pokemon!');
  chat.printMessage('This is a Twitch Plays Pokemon clone built by @Sagnewshreds using the new IP Messaging API.');
  chat.printMessage('Enter the following commands in the chat to play the game:');
  chat.printMessage('["left", "right", "up", "down", "a", "b", "start", "select"]');
  chat.printMessage('Note: Try this in Chrome or Firefox for best results.');
  if (window.localStorage && localStorage.nick) {
    join(localStorage.nick);
  }
});

socket.on('disconnect', function() {
  printMessage('Disconnected. Reconnecting.');
});

socket.on('joined', function() {
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
});

socket.on('connections', function(total) {
  $('.count').text(total);
});

socket.on('join', function(nick, loc) {
  var p = $('<p>');
  p.append($('<span class="join-by">').text(nick));
  if (loc) {
    p.append(' (' + loc + ')');
  }
  p.append(' joined.');
  $('.messages').append(p);
  chat.trimMessages();
});

// Uncomment the following listener to allow users to be notified when a button is pressed.
//socket.on('move', function(move, by) {
//  var p = $('<p class="move">').text(' pressed ' + move);
//  p.prepend($('<span class="move-by">').text(by));
//  $('.messages').append(p);
//  chat.trimMessages();
//});

socket.on('reload', function() {
  setTimeout(function() {
    location.reload();
  }, Math.floor(Math.random() * 10000) + 5000);
});

socket.on('frame', function(data) {
  if (lastImage && 'undefined' != typeof URL) {
    URL.revokeObjectURL(lastImage);
  }
  image.src = blobToImage(data);
  lastImage = image.src;
});

if ('ontouchstart' in window) {
  $('body').addClass('touch');
}

input.focus(function() {
  $('body').addClass('input_focus');
});

input.blur(function() {
  $('body').removeClass('input_focus');
});

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

$('img').mousedown(highlightControls);
$('table.screen-keys td').mousedown(highlightControls);

$('.input form').submit(function(ev) {
  // First prevent the form from being submitted
  ev.preventDefault();

  // Create an array of strings corresponding to GameBoy buttons to test against input
  var gbButtons = ['left', 'right', 'up', 'down', 'a', 'b', 'start', 'select'];
  var enteredText = input.val();

  // Add this if you want to filter input
  // enteredText = censor(enteredText);

  // Do nothing if no text was entered.
  if ('' === enteredText) return;

  // Remove the message that was sent from the form input
  input.val('');

  // Check to see if the user has already joined the chat
  if (joined) {
    if (gbButtons.indexOf(enteredText.toLowerCase()) !== -1) {
      chat.channel.sendMessage(enteredText);
      socket.emit('move', enteredText);
    } else if (enteredText.toLowerCase() === 'up up down down left right left right b a start') {
      // Special surprise.
      chat.konamiCode();
      printMessage(nick, 'This player is currently cheating');
    } else {
      chat.channel.sendMessage(enteredText);
    }
  } else {
    // If the user hasn't joined, then join using their entered text as a username
    join(enteredText);
  }
});
