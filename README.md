## Newscast.js 

Newscast is library to radically simplify Chromecast web app development.

* See a [simple example](http://apps.npr.org/newscast/examples/simple/). (You'll need a Chromecast, of course.)
* See a [more complex example](http://apps.npr.org/newscast/examples/messaging/) with bi-directional communcation.
* Read the [API documentation](http://apps.npr.org/newscast/api/).

## Creating a Newscast

Newscast is optimized for a very simple use-case:

* One sender device and one receiver device
* A single-page that will function as both sender and receiver

For this case, you only need the following code to create a Chromecast-ready Javascript app:

```javascript
new Newscast.Newscast({
    'namespace': 'urn:x-cast:newscast.simple',
    'appId': 'E07BAAC9',
    'debug': true,
    'onReceiverCreated': onCastReceiverCreated,
    'onSenderCreated': onCastSenderCreated,
    'onSenderReady': onCastSenderReady,
    'onSenderStarted': onCastSenderStarted,
    'onSenderStopped': onCastSenderStopped
});
```

There are three pieces of configuration:

* `namespace`: The user-defined communications namespace for your Chromecast app. This should start with `urn:x-cast:` and can then be whatever you want.
* `appId`: The Google-provided unique application ID for your Chromecast app. You get this from the [Google Cast SDK Developer Console](https://cast.google.com/publish/#/overview) when you register your application.
* `debug`: If `true` then debug data will be printed to the Javascript console.

There are also five callbacks you will need to implement:

* `onReceiverCreated` is called when your page is loaded as the receiver and passed a new `Receiver` object. In this callback you should hide any sender-related UI elements and perform any receiver-specific setup.
* `onSenderCreated` is called when your page is loaded as the sender and passed a new `Sender` object. In this callback you should hide any receiver-related UI elements and perform any sender-specific setup.
* `onSenderReady` is called when a Chromecast device is discovered and available for casting. In this callback you should display a "start casting" button and any instructions for your users.
* `onSenderStarted` is called when casting has begun. Here you should hide the "start casting" button and show a "stop casting" button.
* `onSenderStopped` is called when casting has ended. Here you should hide the "stop casting" button and show a "start casting" button.

When the user clicks the"start casting" button, call ``Sender.startCasting()`. To stop the cast, call `Sender.stopCasting()`.

That's it.

See the [simple example](http://apps.npr.org/newscast/examples/simple/) to see this in action.

## Registering your application

Before you can test your application, you'll need to be registered as Chromecast developer with Google (this costs $5), [register your Chromecast device](https://cast.google.com/publish/#/devices) and [register your app](https://cast.google.com/publish/#/applications). Google's documentation for this process is [here](https://developers.google.com/cast/docs/registration).

Use the following configuration when you register your app:

* `Name`: whatever you want
* `Type`: "Custom Receiver"
* `URL`: "https://path.to.my/app.html?newscast-receiver=true"
* `Sender Details / Chrome`: "https://pay.to.my/app.html"

The `newscast-receiver=true` is part of the magic that makes Newscast work.

**Note:** SSL (https://) is required for published applications, but you can test without it.

### Communicating between sender and receiver

Probably the most interesting Chromecast feature is the ability to set up bi-directional communication between the sender and receiver. Newscast sets up this communication pipeline entirely automatically. All you need to do is register the types of messages you'll be sending and receiving and attach callbacks to handle those messages.

Typically you'll want to attach these message handlers in the `onReceiverCreated` and `onSenderCreated` callbacks.For example:

```javascript
var onReceiverCreated = function(receiver) {
    receiver.onMessage('ping', onCastReceiverPingMessage);
};

var onSenderCreated = function(sender) {
    sender.onMessage('pong', onCastSenderPongMessage);
};
```

Each message callback will be passed the message data. The message data *must* be a stron. If you need to pass complex data you 'll need to handle serialiazing and deserializing that data yourself.

To send a message, simply use `Sender.sendMessage()` or `Receiver.sendMessage()`:

```
sender.sendMessage('ping', 'Hello receiver');
receiver.sendMessage('pong', 'I see you sender');
```

See the [messaging example](http://apps.npr.org/newscast/examples/simple/) to see this in action.

## Separate sender and receiver pages

Coming soon...

## Development tasks

Grunt configuration is included for running common development tasks.

Javascript can be linted with [jshint](http://jshint.com/):

```
grunt jshint
```

Uniminified source can be regenerated with:

```
grunt concat
```

Minified source can be regenerated with:

```
grunt uglify
```

API documentation can be generated with:

```
grunt jsdoc
```

The release process is documented [on the wiki](https://github.com/nprapps/newscast.js/wiki/Release-Process).

## License

Released under the MIT open source license. See `LICENSE` for details.

