var module = angular.module('app');
module.controller('activeCameraController', function($scope, camerasList) {
    $scope.ws_video_url = "";
    var externalWsClient;

    debugger;
    var reconnectWS = function() {
        externalWsClient = new WebSocket('ws://192.168.8.10:1234');
        externalWsClient.onclose = reconnectWS;
        externalWsClient.onmessage = function (event) {
            onActiveCameraChanged(JSON.parse(event.data));
        };
    };

    reconnectWS();

    function onActiveCameraChanged(eventData) {
        debugger;
        var cameraId = Number(eventData.cam_id);
        if (cameraId) {
            var camera = camerasList.data.filter(function (c) { return c.id === cameraId; })[0];
            console.log('Camera:', camera);
            if (camera) {
                $scope.ws_video_url = camera.ws_video_url;
                console.log('Url:', $scope.ws_video_url);
                $scope.$apply();
            }
        }
    }

    $scope.test = function () {
        console.log('Cameras: ', camerasList.data);
        onActiveCameraChanged({cam_id: camerasList.data[0].id});
    }
});
