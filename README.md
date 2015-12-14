# Twilio-IP-Messaging-Plays-Pokemon
A clone of the 2013 phenomenon "Twitch Plays Pokemon" using Twilio's new IP Messaging API. This was inspired by an [example](https://github.com/rauchg/weplay) from Socket.io but using Twilio to implement the chat instead of raw websockets.

For step by step instructions on how to build this, [check out my post on the Twilio blog](https://www.twilio.com/blog/2015/12/building-your-own-twitch-plays-pokemon-with-javascript-twilio-ip-messaging-and-socket-io.html).

## Getting Started
In order to get everything running, first clone the repository. 

From the project's root directory run the following command to install all dependencies:

```shell
npm run deps
```

To run the server:

```shell
npm start
```

There are several environment variables you will have to set before continuing:

```shell
export TWILIO_ACCOUNT_SID="INSERT-ACCOUNT-SID-HERE"
export TWILIO_API_KEY="INSERT-API-KEY-SID-HERE"
export TWILIO_API_SECRET="INSERT-API_SECRET-SID-HERE"
export TWILIO_IPM_SERVICE_SID="INSERT-IPM-SERVICE-SID-HERE"
export WEPLAY_ROM="/path/to/gameboy/rom"
```

If you are confused for which values to put for these variables, you can read a more thorough explanation in [this blog post](export WEPLAY_ROM="/path/to/gameboy/rom").
