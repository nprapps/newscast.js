/*
 * Lightweight Chromecasting library.
 */

/* global module */
/* global console */
/* global chrome */

var Newscast = function(config) {
    var MESSAGE_DELIMITER = 'NEWSCAST';
    var _messageRegex = new RegExp('(\\S+)' + MESSAGE_DELIMITER + '(.+)$');

    var _isReceiver = (window.location.search.indexOf('chromecast') >= 0);

    if (config.hasOwnProperty('isReceiver')) {
        _isReceiver = config['isReceiver'];
    }

    var _namespace = config['namespace'];
    var _appId = config['appId'];
    var _onReceiverCreated = config['onReceiverCreated'];
    var _onSenderCreated = config['onSenderCreated'];
    var _onSenderReady = config['onSenderReady'];
    var _onSenderStarted = config['onSenderStarted'];
    var _onSenderStopped = config['onSenderStopped'];
    var _debug = config['debug'] || false;

    /*
     * Receiver
     */
    var Receiver = function() {
        var _customMessageBus = null;
        var _senderId = null;
        var _messageHandlers = {};
        
        /*
         * Log a debugging message.
         */
        var _log = function(message, raw) {
            if (_debug) {
                if (!raw) {
                    message = 'NEWSCAST.Receiver: ' + message;
                }

                console.log(message);
            }
        }

        /*
         * Receiver ready.
         */
        var _onCastReceiverReady = function(e) {
            _senderId = e.data.launchingSenderId;
            
            _log('Got sender id: ' + _senderId);
        }

        /*
         * New message received.
         */
        var _onReceiveMessage = function(e) {
            _log('Received message: ' + e.data);

            var match = e.data.match(_messageRegex);

            var messageType = match[1];
            var message = match[2];

            _fire(messageType, message);
        }

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
        }

        /*
         * Send a message to the Sender.
         */
        var sendMessage = function(messageType, message) {
            message = messageType + MESSAGE_DELIMITER + message;

            _log('Sending message: ' + message);
            
            _customMessageBus.send(
                senderId,
                message
            )
        }

        _log('Initializing receiver');

        var castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
        _customMessageBus = castReceiverManager.getCastMessageBus(_namespace);

        castReceiverManager.onReady = _onCastReceiverReady;
        _customMessageBus.onMessage = _onReceiveMessage; 

        castReceiverManager.start();

        return {
            'onMessage': onMessage,
            'sendMessage': sendMessage
        };
    }

    /*
     * Sender
     */
    var Sender = function() {
        var _session = null;
        var _messageHandlers = {};

        /*
         * Log a debugging message.
         */
        var _log = function(message, raw) {
            if (_debug) {
                if (!raw) {
                    message = 'NEWSCAST.Sender: ' + message;
                }

                console.log(message);
            }
        }

        /*
         * Listen for existing sessions with the receiver.
         */
        var _sessionListener = function(session) {
            _log('Session created')

            _session = session;
            _session.addUpdateListener(_sessionUpdateListener);

            if (_onSenderStarted) {
                _onSenderStarted();
            }
        }

        /*
         * Listen for changes to the session status.
         */
        var _sessionUpdateListener = function(isAlive) {
            if (!isAlive) {
                _log('Session no longer alive')

                if (_onSenderStopped) {
                    _onSenderStopped();
                }
            }
        }

        /*
         * Listen for receivers to become available.
         */
        var _receiverListener = function(e) {
            if (e === chrome.cast.ReceiverAvailability.AVAILABLE) {
                _log('Receiver is available')

                if (_onSenderReady) {
                    _onSenderReady();
                }
            } else if (e === chrome.cast.ReceiverAvaibility.UNAVAILABLE) {
                _log('Receiver not available')
            }
        }

        /*
         * Environment successfully initialized.
         */
        var _onInitSuccess = function(e) {
            _log('Chromecast initialized')
        }

        /*
         * Error initializing.
         */
        var _onInitError = function(e) {
            _log('Chromecast initialization failed, error:');
            _log(e, true);
        }

        /*
         * Start casting.
         */
        var startCasting = function() {
            _log('Starting cast');

            chrome.cast.requestSession(_onRequestSessionSuccess, _onRequestSessionError);
        }

        /*
         * Casting session begun successfully.
         */
        var _onRequestSessionSuccess = function(session) {
            _log('Session created');

            _session = session;
            _session.addUpdateListener(_sessionUpdateListener);

            if (_onSenderStarted) {
                _onSenderStarted();
            }
        }

        /*
         * Casting session failed to start.
         */
        var _onRequestSessionError = function(e) {
            _log('Failed to create session, error:');
            _log(e, true);
        }

        /*
         * Stop casting.
         */
        var stopCasting = function() {
            _log('Stopping cast');

            _session.stop(_onSessionStopSuccess, _onSessionStopError);
        }

        /*
         * Inform client the session has stopped.
         */
        var _onSessionStopSuccess = function() {
            _log('Cast stopped');

            if (_onSenderStopped) {
                _onSenderStopped();
            }
        }

        /*
         * Session could not be stopped.
         */
        var _onSessionStopError = function(e) {
            _log('Failed to stop cast, error:');
            _log(e, true);
        }

        /*
         * New message received.
         */
        var _onReceiveMessage = function(e) {
            _log('Received message: ' + e.data);

            var match = e.data.match(_messageRegex);

            var messageType = match[1];
            var message = match[2];

            _fire(messageType, message);
        }

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
        }


        /*
         * Send a message to the receiver.
         */
        var sendMessage = function(messageType, message) {
            message = messageType + MESSAGE_DELIMITER + message;
            
            _log('Sending message: ' + message);

            _session.sendMessage(
                _namespace,
                message,
                _onSendSuccess,
                _onSendError
            );
        }

        /*
         * Successfully sent message to receiver.
         */
        var _onSendSuccess = function() {
            _log('Message sent')
        }

        /*
         * Error sending message to receiver.
         */
        var _onSendError = function(e) {
            _log('Failed to send message, error:')
            _log(e, true);
        }

        _log('Initializing sender')

        var sessionRequest = new chrome.cast.SessionRequest(_appId);

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
            'sendMessage': sendMessage
        };
    }

    if (_isReceiver) {
        // Load Receiver library
        var script =  document.createElement('script');
        script.async = false;
        script.type = 'text/javascript';
        script.src = '//www.gstatic.com/cast/sdk/libs/receiver/2.0.0/cast_receiver.js';

        script.onload = function() {
            // Create receiver
            var receiver = Receiver();

            _onReceiverCreated(receiver);

        }

        document.body.appendChild(script);
    } else {
        // Setup Cast Sender API global callback
        window['__onGCastApiAvailable'] = function(loaded, errorInfo) {

            if (loaded) {
                // Create sender
                var sender = Sender();

                console.log(sender);

                _onSenderCreated(sender);
            }
        }
        
        // Load Sender API
        var script =  document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//www.gstatic.com/cv/js/sender/v1/cast_sender.js';
        document.body.appendChild(script);
    }
};
