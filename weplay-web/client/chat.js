// We will be using jQuery to manipulate DOM elements for the chat.
var $ = require('jquery');

// Manages the state of our access token we got from the server
var accessManager;

// Our interface to the IP Messaging service
var messagingClient;

// A handle to the "general" chat channel - the one and only channel we
// will have in this app
var generalChannel;

// The object we are going to export as this module
module.exports = {

  // Remove the oldest message when the number of messages exceeds 300
  trimMessages: function() {
    var messages = $('.messages');
    while (messages.children().length > 300) {
      $(messages.children()[0]).remove();
    }
  },

  // Add a message to the chat bar
  printMessage: function(msg, by) {
    var p = $('<p>').text(msg);
    if (by) {
      p.prepend($('<span class="message-by">').text(by + ': '));
    } else {
      p.addClass('server');
    }
    $('.messages').append(p);
    this.trimMessages();
  },

  // Connect to the Twilio IP Messaging API and set up the chat app
  initializeChat: function(identity) {

    // Get an access token for the current user, passing a username (identity)
    // and a device ID - for browser-based apps, we'll always just use the
    // value "browser"
    $.getJSON('/token', {
      identity: identity,
      device: 'browser'
    }, function(data) {
      // Initialize the IP messaging client
      accessManager = new Twilio.AccessManager(data.token);
      messagingClient = new Twilio.IPMessaging.Client(accessManager);

      // Get the general chat channel, which is where all the messages are
      // sent in this application
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
            this.setupChannel();
          }.bind(this));
        } else {
          console.log('Found general channel:');
          console.log(generalChannel);
          this.setupChannel();
        }

        this.channel = generalChannel;
      }.bind(this));
    }.bind(this));
  },

  // Set up channel after it has been found
  setupChannel: function() {
    var onMessageAdded = function(newMessage) {
      this.printMessage(newMessage.body, newMessage.author);
    }.bind(this);

    // Join the general channel
    generalChannel.join().then(function(channel) {
      // Listen for new messages sent to the channel
      generalChannel.on('messageAdded', onMessageAdded);
    });

  },

  // Allows user to control the game without chat.
  konamiCode : function() {
    alert('You think you\'re clever huh? You have 5 minutes');
    console.log('Konami code entered!');
    $(document).on('keydown', function(ev){
      // if (null == nick) return;
      var code = ev.keyCode;
      if ($('body').hasClass('input_focus')) return;
      if (map[code]) {
        ev.preventDefault();
        socket.emit('move', map[code]);
      }
      window.setTimeout(function() {
        $(document).on('keydown', function() {});
      }, 300000);
    });
  }
};
