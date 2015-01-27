/*
 * Lightweight Chromecasting library.
 */

/* global module */
/* global console */
/* global chrome */
/* global cast */

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        window.Newscast = factory.call(this);
    }
})(function() {
    var MESSAGE_DELIMITER = 'NEWSCAST';
    var MESSAGE_REGEX = new RegExp('(\\S+)' + MESSAGE_DELIMITER + '(.+)$');
  
    /*
     * Receiver
     */
    var Receiver = function(config) {
        var _config = config;

        var _customMessageBus = null;
        var _senderId = null;
        var _messageHandlers = {};

        /*
         * Log a debugging message.
         */
        var _log = function(message, raw) {
            if (config['debug']) {
                if (!raw) {
                    message = 'Newscast.Receiver: ' + message;
                }

                console.log(message);
            }
        };

        /*
         * Receiver ready.
         */
        var _onCastReceiverReady = function(e) {
            _senderId = e.data.launchingSenderId;
            
            _log('Got sender id: ' + _senderId);
        };

        /*
         * New message received.
         */
        var _onReceiveMessage = function(e) {
            _log('Received message: ' + e.data);

            var match = e.data.match(MESSAGE_REGEX);

            var messageType = match[1];
            var message = match[2];

            _fire(messageType, message);
        };

        /*;
         * Fire handler callbacks for a given message.
         */
        var _fire = function(messageType, message) {
            if (messageType in _messageHandlers) {
                for (var i = 0; i < _messageHandlers[messageType].length; i++) {
                    _messageHandlers[messageType][i](message);
                }
            }
        };

        /*
         * Register a new message handler callback.
         */
        var onMessage = function(messageType, callback) {
            if (!(messageType in _messageHandlers)) {
                _messageHandlers[messageType] = [];
            }

            _messageHandlers[messageType].push(callback);
        };

        /*
         * Send a message to the Sender.
         */
        var sendMessage = function(messageType, message) {
            message = messageType + MESSAGE_DELIMITER + message;

            _log('Sending message: ' + message);
            
            _customMessageBus.send(
                _senderId,
                message
            );
        };

        _log('Initializing receiver');

        var castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
        _customMessageBus = castReceiverManager.getCastMessageBus(_config['namespace']);

        castReceiverManager.onReady = _onCastReceiverReady;
        _customMessageBus.onMessage = _onReceiveMessage; 

        castReceiverManager.start();

        return {
            'onMessage': onMessage,
            'sendMessage': sendMessage
        };
    };

    /*
     * Sender
     */
    var Sender = function(config) {
        var _config = config;

        var _session = null;
        var _messageHandlers = {};

        /*
         * Log a debugging message.
         */
        var _log = function(message, raw) {
            if (config['debug']) {
                if (!raw) {
                    message = 'Newscast.Sender: ' + message;
                }

                console.log(message);
            }
        };

        /*
         * Listen for existing sessions with the receiver.
         */
        var _sessionListener = function(session) {
            _log('Session created');

            _session = session;
            _session.addUpdateListener(_sessionUpdateListener);

            if (config['onSenderStarted']) {
                config['onSenderStarted']();
            }
        };

        /*
         * Listen for changes to the session status.
         */
        var _sessionUpdateListener = function(isAlive) {
            if (!isAlive) {
                _log('Session no longer alive');

                if (config['onSenderStopped']) {
                    config['onSenderStopped']();
                }
            }
        };

        /*
         * Listen for receivers to become available.
         */
        var _receiverListener = function(e) {
            if (e === chrome.cast.ReceiverAvailability.AVAILABLE) {
                _log('Receiver is available');

                if (config['onSenderReady']) {
                    config['onSenderReady']();
                }
            } else if (e === chrome.cast.ReceiverAvailability.UNAVAILABLE) {
                _log('Receiver not available');
                _log(e, true);
            }
        };

        /*
         * Environment successfully initialized.
         */
        var _onInitSuccess = function() {
            _log('Chromecast initialized');
        };

        /*
         * Error initializing.
         */
        var _onInitError = function(e) {
            _log('Chromecast initialization failed, error:');
            _log(e, true);
        };

        /*
         * Start casting.
         */
        var startCasting = function() {
            _log('Starting cast');

            chrome.cast.requestSession(_onRequestSessionSuccess, _onRequestSessionError);
        };

        /*
         * Casting session begun successfully.
         */
        var _onRequestSessionSuccess = function(session) {
            _log('Session created');

            _session = session;
            _session.addUpdateListener(_sessionUpdateListener);
            _session.addMessageListener(_config['namespace'], _onReceiveMessage); 

            if (_config['onSenderStarted']) {
                _config['onSenderStarted']();
            }
        };

        /*
         * Casting session failed to start.
         */
        var _onRequestSessionError = function(e) {
            _log('Failed to create session, error:');
            _log(e, true);
        };

        /*
         * Stop casting.
         */
        var stopCasting = function() {
            _log('Stopping cast');

            _session.stop(_onSessionStopSuccess, _onSessionStopError);
        };

        /*
         * Inform client the session has stopped.
         */
        var _onSessionStopSuccess = function() {
            _log('Cast stopped');

            if (config['onSenderStopped']) {
                config['onSenderStopped']();
            }
        };

        /*
         * Session could not be stopped.
         */
        var _onSessionStopError = function(e) {
            _log('Failed to stop cast, error:');
            _log(e, true);
        };

        /*
         * New message received.
         */
        var _onReceiveMessage = function(namespace, data) {
            _log('Received message: ' + data);

            var match = data.match(MESSAGE_REGEX);

            var messageType = match[1];
            var message = match[2];

            _fire(messageType, message);
        };

        /*
         * Fire handler callbacks for a given message.
         */
        var _fire = function(messageType, message) {
            if (messageType in _messageHandlers) {
                for (var i = 0; i < _messageHandlers[messageType].length; i++) {
                    _messageHandlers[messageType][i](message);
                }
            }
        };

        /*
         * Register a new message handler callback.
         */
        var onMessage = function(messageType, callback) {
            if (!(messageType in _messageHandlers)) {
                _messageHandlers[messageType] = [];
            }

            _messageHandlers[messageType].push(callback);
        };


        /*
         * Send a message to the receiver.
         */
        var sendMessage = function(messageType, message) {
            message = messageType + MESSAGE_DELIMITER + message;
            
            _log('Sending message: ' + message);

            _session.sendMessage(
                config['namespace'],
                message,
                _onSendSuccess,
                _onSendError
            );
        };

        /*
         * Successfully sent message to receiver.
         */
        var _onSendSuccess = function() {
            _log('Message sent');
        };

        /*
         * Error sending message to receiver.
         */
        var _onSendError = function(e) {
            _log('Failed to send message, error:');
            _log(e, true);
        };

        _log('Initializing sender');

        var sessionRequest = new chrome.cast.SessionRequest(config['appId']);

        var apiConfig = new chrome.cast.ApiConfig(
            sessionRequest,
            _sessionListener,
            _receiverListener,
            chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        );

        chrome.cast.initialize(apiConfig, _onInitSuccess, _onInitError);

        return {
            'startCasting': startCasting,
            'stopCasting': stopCasting,
            'sendMessage': sendMessage,
            'onMessage': onMessage
        };
    };

    /*
     * Simple bidirectional app all on one page.
     */
    var Newscast = function(config) {
        var _config = config;

        if (!config.hasOwnProperty('isReceiver')) {
            config['isReceiver'] = (window.location.search.indexOf('chromecast') >= 0);
        }

        /*
         * Log a debugging message.
         */
        var _log = function(message, raw) {
            if (config['debug']) {
                if (!raw) {
                    message = 'Newscast.Newcast: ' + message;
                }

                console.log(message);
            }
        };

        var script =  document.createElement('script');
        script.async = false;
        script.type = 'text/javascript';

        if (config['isReceiver']) {
            // Load Receiver library
            script.src = '//www.gstatic.com/cast/sdk/libs/receiver/2.0.0/cast_receiver.js';

            script.onload = function() {
                // Create receiver
                var receiver = new Receiver(_config);

                config['onReceiverCreated'](receiver);

            };

            document.body.appendChild(script);
        } else {
            // Setup Cast Sender API global callback
            window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
                if (loaded) {
                    // Create sender
                    var sender = new Sender(_config);

                    config['onSenderCreated'](sender);
                } else {
                   _log('Failed to load Chromecast library, error:');
                   _log(errorInfo, true);
                }
            };
            
            // Load Sender API
            script.src = '//www.gstatic.com/cv/js/sender/v1/cast_sender.js';
            document.body.appendChild(script);
        }
    };

    return {
        'Receiver': Receiver,
        'Sender': Sender,
        'Newscast': Newscast
    };
});
