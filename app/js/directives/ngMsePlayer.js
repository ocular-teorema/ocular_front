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


            var video = element.get(0),
                ms,
                client,
                startTimes;

            var sourcesData = [], videoCorrectionInterval;
            var videoCorrectionTime = 1000;


            var iniMSPlayer = function() {
                video.pause();
                ms = new MediaSource();
                ms.addEventListener('sourceopen', onMediaSourceOpen);
                video.src = URL.createObjectURL(ms);

                startTimes = undefined;
                videoCorrectionInterval ? clearInterval(videoCorrectionInterval) : false;
            };

            video.onplay = function() {
                if (!startTimes) {

                    video.currentTime = video.currentTime - 2;

                    startTimes = {
                        video: video.currentTime,
                        system: Date.now()
                    };

                    videoCorrectionInterval = setInterval(function() {
                        var currTime = (video.currentTime - startTimes.video) * 1000;
                        var currTimeRange = Date.now() - startTimes.system;

                        video.playbackRate = Math.min(
                            Math.max(1, (videoCorrectionTime + currTimeRange - currTime) / videoCorrectionTime),
                            1.5
                        );
                        console.log(video.playbackRate);
                    }, videoCorrectionTime);
                }
            };

            video.oncanplay = function() {
                console.log('on Play');
                if (!startTimes) {
                    console.log('Play');
                    video.play();
                }
            };

            var onMediaSourceOpen = function() {
                var sourceBuffer = ms.addSourceBuffer('video/mp4; codecs="avc1.4d401f"');

                sourceBuffer.onupdateend = function() {
                    if (sourceBuffer.updating) return;
                    var source = sourcesData.shift();
                    if (!source) {
                        return;
                    }
                    sourceBuffer.appendBuffer(source);
                };

                client = new WebSocket($scope.ngMsePlayer.stream);
                client.binaryType = 'arraybuffer';

                client.onmessage = function(event) {
                    if (sourceBuffer.updating) {
                        sourcesData.push(event.data);
                    } else {
                        sourceBuffer.appendBuffer(event.data);
                    }

                    if (!startTimes) {
                        video.currentTime = 1000000000;
                    }
                };
                client.onclose = function() {
                    iniMSPlayer();
                };
            };


            iniMSPlayer();

            $scope.$on('$destroy', function() {
                client.onclose = undefined;
                client.close();
                clearInterval(videoCorrectionInterval);
            });
        }
    }
});

