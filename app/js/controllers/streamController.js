var module = angular.module('app');
module.controller('streamController', function(
    $scope,
    currentUser,
    $rootScope,
    camerasQuadrators,
    $interval,
    camerasList,
    $timeout,
    WebSocketService,
    $sce
) {

    $scope.quadratorsList = camerasQuadrators.data;
    $scope.camerasQuadrator = camerasQuadrators.data[0];

    var startServerDateTime = new Date(camerasQuadrators.headers('date')).getTime(),
        startLocalDateTime = new Date().getTime();


    /* Select for output cameras stream resolution */

    var resolutions = [
        {
            size: '4x3',
            values: [[1024], [768]]
        }, {
            size: '16x9',
            values: [[1920], [1080]]
        }, {
            size: '21x9',
            values: [[2560], [1080]]
        }
    ];


    var svgSizes;
    var checkQuadratorSize = function() {
        var minRangeResolution = 10;

        var currentResolution =
            ($scope.camerasQuadrator.output_width / $scope.camerasQuadrator.num_cam_x) /  ($scope.camerasQuadrator.output_height / $scope.camerasQuadrator.num_cam_y);

        $scope.camSize = 100 / $scope.camerasQuadrator.num_cam_x;

        resolutions.forEach(function(resolution) {
            var newResolution = Math.abs(resolution.values[0]/resolution.values[1] - currentResolution);
            if (minRangeResolution > newResolution) {
                minRangeResolution = newResolution;
                $scope.selectedSize = resolution.size;
            }
        });

        var sizesOfScreen = $scope.selectedSize.split('x');
        svgSizes = {
            w: $scope.camerasQuadrator.num_cam_x * sizesOfScreen[0],
            h: $scope.camerasQuadrator.num_cam_y * sizesOfScreen[1]
        };
        $scope.svgImg = $sce.trustAsHtml('<svg xmlns="http://www.w3.org/2000/svg" ' +
            'viewBox="0 0 '+ svgSizes['w'] + " " + svgSizes['h'] + '" class="cameras-table-size_img" id="cameras-list-wrapper"></svg>');
        $timeout(function() {
            $scope.iniSvgMask();
        });
    };

    $scope.iniSvgMask = function() {
        var svg = jQuery('.img-wrapper .cameras-table-size_img');
        if (!svg.length) return;
        var allContentWrapper = svg.parents('.cameras-table').first();

        if ((allContentWrapper.width() / svgSizes.w) > (allContentWrapper.height() / svgSizes.h)) {
            svg.css({
                width: 'auto',
                height: allContentWrapper.height()
            });
        } else {
            svg.css({
                width: allContentWrapper.width(),
                height: 'auto'
            });
        }
    };

    jQuery(window).on('resize', $scope.iniSvgMask);

    var types = ['record-analize', 'motion-analize', 'full-analize'];

    $scope.quadratorsList.map(function(quadrator) {
        quadrator.full_cameras = quadrator.cameras.map(function(cameraId) {
            var cameraItem = camerasList.data.filter(function(camera) {
                return camera.id === cameraId;
            })[0];
            cameraItem['analysis-icon'] = types[cameraItem.analysis - 1];
            cameraItem['noReactionEvents'] = [];
            cameraItem['events'] = [];
            cameraItem['latestEvents'] = [];
            return cameraItem;
        });
    });


    var checkLatestEvents = function(camera) {
        var oldLatestLength = camera.latestEvents.length;
        camera.latestEvents = camera.events.filter(function(eventData) {
            return $scope.confidence <= eventData.confidence;
        });

        if (oldLatestLength < camera.latestEvents.length) {
            Beep.play();
        }
    };

    var resetEventsList = function(camerasQuadrator) {
        camerasQuadrator.full_cameras.map(function(cameraItem) {
            cameraItem['noReactionEvents'] = [];
            cameraItem['events'] = [];
            cameraItem['latestEvents'] = [];
        });
    };

    $scope.$watch('camerasQuadrator', function(newQu, oldQu) {
        checkQuadratorSize();
        $scope.closeSelectedCamera();
        $scope.showVideoContainer = false;
        $timeout(function() {
            $scope.showVideoContainer = true;
        });

        resetEventsList(oldQu);

        WebSocketService.subscribe($scope.camerasQuadrator.cameras.filter(function(value, index, self) {
            return self.indexOf(value) === index;
        }), function(eventData) {
            var cameras = $scope.camerasQuadrator.full_cameras.filter(function(cam) {
                return cam.id == eventData.camera_id;
            });

            if (!cameras.length) return;

            cameras.forEach(function(camera) {
                if (eventData.isStarted) {
                    camera.events.push(eventData);
                }
                if (eventData.isFinished) {
                    camera.events = camera.events.filter(function(event) {
                        return event.id != eventData.id;
                    });
                    if (eventData.reaction == '-1') {
                        camera.noReactionEvents.push(eventData);
                    }
                }

                checkLatestEvents(camera);

                if (camera) {
                    camera.withWarning = true;
                }
            });
        });

    });


    $scope.securityReaction = function(reaction, camera) {
        if (!camera.events) return;
        WebSocketService.sendReaction({
            reaction: reaction,
            camera_id: camera.id,
            id: camera.events[camera.events.length - 1].id
        });
    };



    /* Просмотр события */
    var iframeContainer = angular.element('<div>');
    var iframe = angular
        .element('<iframe>')
        .addClass('video-repeater')
        .appendTo(iframeContainer);

    var initedDialog = false;

    $scope.openEvent = function(camera) {
        var event = camera.noReactionEvents.pop();
        var parser = document.createElement('a');
        parser.href = camera.ws_video_url;

        iframe.attr(
            'src',
            '/video.html?video=' +
            encodeURIComponent(
                'http://' +
                parser.hostname +
                ':8080/cam' +
                camera['id'] +
                '/alertFragments/alert' +
                event.id +
                '.mp4'
            )
        );
        var dialogParams = {
            title: camera.camera_group.name + ' - ' + camera.name,
            resizable: true
        };

        if (!initedDialog) {
            initedDialog = true;
            dialogParams.width = 570;
            dialogParams.height = 315;
        }
        iframeContainer.dialog(dialogParams);
    };


    $rootScope.pageScope = $scope;
    $scope.fullScreen = false;


    /* Управление полноэкранным режимом */
    var toggleFullScreen = function(open) {

        console.log(open);

        var elem = document.body;

        if (open &&
            ((document.fullScreenElement !== undefined &&
                document.fullScreenElement === null) ||
                (document.msFullscreenElement !== undefined &&
                    document.msFullscreenElement === null) ||
                (document.mozFullScreen !== undefined && !document.mozFullScreen) ||
                (document.webkitIsFullScreen !== undefined &&
                    !document.webkitIsFullScreen))
        ) {
            if (elem.requestFullScreen) {
                elem.requestFullScreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullScreen) {
                elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    $scope.setFullScreenMode = function() {
        toggleFullScreen(document.webkitFullscreenEnabled || document.fullscreenEnabled);
    };
    $scope.removeFullScreenMode = function() {
        toggleFullScreen(document.webkitFullscreenEnabled || document.fullscreenEnabled);
    };

    var Beep = document.getElementById('beep');

    $scope.setSelectedCamera = function(camera) {
        $scope.selectedCamera = camera;
        $timeout(function() {
            $scope.iniSvgMask();
        });
    };

    $scope.closeSelectedCamera = function() {
        $scope.selectedCamera = false;
        $timeout(function() {
            $scope.iniSvgMask();
        });
    };

    var localStorage = window.localStorage || {};

    $scope.confidence = localStorage['dangerLavel']
        ? localStorage['dangerLavel']
        : 0;

    $scope.onSelectDanger = function(value) {
        $scope.camerasQuadrator.full_cameras.map(checkLatestEvents);
        localStorage['dangerLavel'] = JSON.stringify(value);
    };

    $scope.displayingList = [
        {
            label: 'высокий уровень опасности',
            value: 80
        }
    ];

    $scope.quadratorsSelectParams = {
        label: 'name',
        class: 'select-3'
    };

    $scope.displayingList = $scope.displayingList.concat([
        {
            label: 'средний и высокий уровни опасности',
            value: 50
        },
        {
            label: 'все уровни опасности',
            value: 0
        }
    ]);

    $scope.date = new Date();

    var getNewTime = function() {
        $scope.date = new Date(startServerDateTime + (new Date().getTime()) - startLocalDateTime);
    };

    var dateTimeInterval = $interval(getNewTime, 200);

    $scope.$on('$destroy', function() {
        $interval.cancel(dateTimeInterval);
    });

});
