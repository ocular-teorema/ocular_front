var module = angular.module('Directives');
module.directive('ngMsePlayer', function($timeout) {
    return {
        'restrict': 'A',
        'scope': {
            ngMsePlayer: '='
        },
        'controller': function ($scope) {
        },

        'link': function ($scope, element) {

            var wfs;

            var onPlay = function() {
                element.replaceWith(currentMedia);
                element.empty().remove();
                element = currentMedia;
            };

            var currentMedia;
            var reconnectTime;
            var iniPlayer = function() {
                wfs = new Wfs();
                currentMedia = element.clone();
                wfs.attachMedia(
                    currentMedia.get(0), {
                        host: $scope.ngMsePlayer.stream,
                        onerror: function() {
                            reconnectTime = setTimeout(function() {
                                iniPlayer();
                            }, 4000);
                        }
                    }
                );
                wfs.media.addEventListener("play", function() {
                    if ((currentMedia.is(wfs.media)) && (currentMedia !== element)) {
                        onPlay();
                    };
                });
            };


            $timeout(iniPlayer, 10);

            $scope.$on('$destroy', function() {
                element.empty().remove();
                if (reconnectTime) {
                    clearTimeout(reconnectTime);
                }
                wfs.websocketLoader.client.onclose = undefined;
                wfs.websocketLoader.client.close();
            });
        }
    }
});

