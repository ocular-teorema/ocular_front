var module = angular.module('Services');
module.service('WebSocketService', function($location) {

    // var port = '';
    // var host = '78.46.97.176';

    var host = $location.$$host;
    var port = $location.$$port ? ':' + $location.$$port : '';


    var path = '/ws/';

    var client;

    var openedClient;
    var openCallback;
    var latestSubscription;
    var onConnectCb;
    var onDisconnectCb;

    var subscribe = function(ids, callback) {
        latestSubscription = {
            ids: ids,
            callback: callback
        };
        client.onmessage = function (event) {
            callback(JSON.parse(event.data));
        };

        openCallback = false;

        if (openedClient) {
            client.send(JSON.stringify({"subscribe": ids}));
        } else {
            openCallback = function () {
                client.send(JSON.stringify({"subscribe": ids}));
            };
        }
    };

    var reconnectWS = function() {
        client = new WebSocket('ws://' + host + port + path);
        // client.onclose = reconnectWS;
        client.onclose = function() {
            console.log('close connection socket');
            openedClient = false;
            onDisconnectCb ? onDisconnectCb() : true;
            reconnectWS();
        };
        client.onopen = function() {
            console.log('start connection socket');
            openedClient = true; 
            openCallback ? openCallback() : false;
            onConnectCb ? onConnectCb() : false;
        };
        if (!latestSubscription) return;
        subscribe(latestSubscription.ids, latestSubscription.callback);
    };

    reconnectWS();

    var addOnConnectHandler = function(cb) {
        onConnectCb = cb;
        if (openedClient) {
            onConnectCb();
        }
    }

    var addOnDisconnectHandler = function(cb) {
        onDisconnectCb = cb;
        if (!openedClient) {
            onDisconnectCb();
        }
    }

    return {
        addOnConnectHandler: addOnConnectHandler,
        addOnDisconnectHandler: addOnDisconnectHandler,
        subscribe: subscribe,
        unsubscribe: function() {
            client.onmessage = undefined;
            client.send(JSON.stringify({"subscribe": []}));
        },
        sendReaction: function(data) {
            client.send(JSON.stringify(data));
        }
    }
});