
angular
    .module('app')
    .controller('settingsController',
        function($scope, CamerasService, $rootScope) {
            $scope.userCameras = angular.copy($rootScope.userCameras);

            $scope.cameraModel = $scope.userCameras.groups.filter(function(group) {
                return group.cameras.length;
            })[0]['cameras'][0];

            $scope.cameraForRequest = angular.copy($scope.cameraModel);
            
            $scope.activateGroup = function(group) {
                if ($scope.activedGroup === group) {
                    group.active = !group.active;
                    $scope.activedGroup = undefined;
                } else {
                    if ($scope.activedGroup) {
                        $scope.activedGroup.active = false;
                    }
                    $scope.activedGroup = group;
                    group.active = true;
                }
            };
            $scope.setCameraModel = function(camera) {
                $scope.cameraModel = camera;
            };

            $scope.notificationTypes = {};

            $scope.timesList = [];
            var timeRange = 30;
            for (var t = 0; t < 1440; t += timeRange) {
                var h = Math.floor(t / 60);
                var m = t % 60;
                h = (h < 10 ? '0' : '') + h;
                m = (m < 10 ? '0' : '') + m;
                $scope.timesList.push(h + ':' + m);
            }
            $scope.startTime = '00:00';
            $scope.endTime = '06:00';
            $scope.displayingList = [
                {
                    label: "высокий",
                    value: 80
                }, {
                    label: "средний и высокий",
                    value: 50
                }, {
                    label: "все уровни",
                    value: 0
                }
            ];

            $scope.resetReportingParams = function() {
                $scope.cameraForRequest = angular.copy($scope.cameraModel);
            };

            $scope.saveSettings = function(form) {
                if (!form.$valid) return;
                $scope.cameraForRequest.notify_events = [];
                for (var i in $scope.notificationTypes) {
                    if ($scope.notificationTypes[i]) {
                        $scope.cameraForRequest.notify_events.push(i);
                    }
                }
                $scope.cameraForRequest.notify_email = $scope.cameraForRequest.notify_email || null;
                $scope.cameraForRequest.notify_phone = $scope.cameraForRequest.notify_phone || null;

                $scope.cameraForRequest.camera_group = $scope.cameraForRequest.group.id;
                $scope.cameraForRequest.group = undefined;

                CamerasService.updateCamera($scope.cameraForRequest).then(function(response) {
                    var cam = response.data;
                    console.log(cam);
                    $scope.userCameras.groups.map(function() {

                    });
                });
            };
        });