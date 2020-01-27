var module = angular.module('app');
module.controller('streamController', function (
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

    var localStorage = window.localStorage || {};

    $scope.vm = { 
        camerasQuadrator: camerasQuadrators.data[0],
        confidence: (localStorage['dangerLavel'] ? localStorage['dangerLavel'] : 0),
        selectedCamera: false
    };

    $scope.quadratorsList = camerasQuadrators.data;

    var startServerDateTime = new Date(camerasQuadrators.headers('date')).getTime(),
        startLocalDateTime = new Date().getTime();

    var Beep = document.getElementById('beep');

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
    var checkQuadratorSize = function () {
        var minRangeResolution = 10;

        var currentResolution = $scope.vm.camerasQuadrator
            ? $scope.vm.camerasQuadrator.output_width / $scope.vm.camerasQuadrator.num_cam_x / ($scope.vm.camerasQuadrator.output_height / $scope.vm.camerasQuadrator.num_cam_y)
            : 1;

        $scope.camSizeX = $scope.vm.camerasQuadrator ? 100 / $scope.vm.camerasQuadrator.num_cam_x : 100;
        $scope.camSizeY = $scope.vm.camerasQuadrator ? 100 / $scope.vm.camerasQuadrator.num_cam_y : 100;

        resolutions.forEach(function (resolution) {
            var newResolution = Math.abs(resolution.values[0] / resolution.values[1] - currentResolution);
            if (minRangeResolution > newResolution) {
                minRangeResolution = newResolution;
                $scope.selectedSize = resolution.size;
            }
        });

        var sizesOfScreen = $scope.selectedSize.split('x');
        svgSizes = {
            w: ($scope.vm.camerasQuadrator ? $scope.vm.camerasQuadrator.num_cam_x : 1) * sizesOfScreen[0],
            h: ($scope.vm.camerasQuadrator ? $scope.vm.camerasQuadrator.num_cam_y : 1) * sizesOfScreen[1]
        };
        $scope.svgImg = $sce.trustAsHtml('<svg xmlns="http://www.w3.org/2000/svg" ' +
            'viewBox="0 0 ' + svgSizes['w'] + " " + svgSizes['h'] + '" class="cameras-table-size_img" id="cameras-list-wrapper"></svg>');
        $timeout(function () {
            $scope.iniSvgMask();
        });
    };

    $scope.iniSvgMask = function () {
        var svg = jQuery('.img-wrapper .cameras-table-size_img');
        if (!svg.length) return;
        var allContentWrapper = svg.parents('.cameras-table').first();

        if (allContentWrapper.width() / svgSizes.w > allContentWrapper.height() / svgSizes.h) {
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

    $scope.quadratorsList.forEach(function (quadrator) {
        quadrator.cells = [];
        for (var i = 0; i < quadrator.num_cam_y; i++) {
            var row = [];
            quadrator.cells.push(row);
            for (var j = 0; j < quadrator.num_cam_x; j++) {
                row.push({ hidden: false, params: { cols: 1, rows: 1 } });
            }
        }
        quadrator.cameras.forEach(function (cameraInQuadrator) {
            var cell = quadrator.cells[cameraInQuadrator.y][cameraInQuadrator.x];
            for (var l = 0; l < cameraInQuadrator.cols; l++)
                for (var h = 0; h < cameraInQuadrator.rows; h++)
                    quadrator.cells[cameraInQuadrator.y + h][cameraInQuadrator.x + l].hidden = l !== 0 || h !== 0;
            cell.params = cameraInQuadrator;
            cell.camera = camerasList.data.filter(function (camera) {
                return camera.unique_id === cameraInQuadrator.unique_id;
            })[0];
            cell.camera['analysis-icon'] = types[cell.camera.analysis - 1];
            cell.camera['noReactionEvents'] = [];
            cell.camera['events'] = [];
            cell.camera['latestEvents'] = [];
        });
        console.log('quadrator', quadrator);
    });


    var checkLatestEvents = function (camera) {
        var oldLatestLength = camera.latestEvents.length;
        camera.latestEvents = camera.events.filter(function (eventData) {
            return $scope.vm.confidence <= eventData.confidence;
        });

        camera.noReactionEvents = camera.noReactionEvents.filter(function (eventData) {
            return $scope.vm.confidence <= eventData.confidence;
        });

        if (oldLatestLength < camera.latestEvents.length) {
            try {
                Beep.play().catch(function (ex) {
                    console.log('Unable to play sound: ', ex);
                });
            }
            catch (e) {
                console.log('Unable to play sound: ', e);
            }
        }
    };

    var resetEventsList = function (camerasQuadrator) {
        if (camerasQuadrator && camerasQuadrator.cells && camerasQuadrator.cells.length) {
            for (var row = 0; row < camerasQuadrator.num_cam_y; row++)
                for (var col = 0; col < camerasQuadrator.num_cam_x; col++) {
                    var cell = camerasQuadrator.cells[row][col];
                    if (cell.camera) {
                        cell.camera['noReactionEvents'] = [];
                        cell.camera['events'] = [];
                        cell.camera['latestEvents'] = [];
                    }
                }
        }
    };

    var currentPinger;
    var ststusMsgConnect;
    var sendMsgPing = function () { 

        console.log('send guad_id:', $scope.vm.camerasQuadrator.id);

        WebSocketService.sendReaction({
            quad_id: $scope.vm.camerasQuadrator.id,
        });

        currentPinger = $timeout(sendMsgPing, 30000);
    }

    var sendViewSelected = function() {        
        if (currentPinger) {
            $timeout.cancel(currentPinger);
        }
        sendMsgPing();
    }

    WebSocketService.addOnConnectHandler(function() {
        sendViewSelected();
        ststusMsgConnect = true;
    });

    $scope.$watch('vm.camerasQuadrator', function (newQu, oldQu) {
        checkQuadratorSize();
        $scope.closeSelectedCamera();
        $scope.showVideoContainer = false;
        $timeout(function () {
            $scope.showVideoContainer = true;
        });

        resetEventsList(oldQu);

        (ststusMsgConnect) ? sendViewSelected() : null;

        if ($scope.vm.camerasQuadrator) {
            WebSocketService.subscribe($scope.vm.camerasQuadrator.cameras.filter(function (value, index, self) {
                return self.indexOf(value) === index;
            }).map(function (cam) {
                return cam.unique_id;
            }), function (eventData) {
                if (!$scope.vm.camerasQuadrator)
                    return;
                var cameras = [];

                for (var row = 0; row < $scope.vm.camerasQuadrator.num_cam_y; row++)
                    for (var col = 0; col < $scope.vm.camerasQuadrator.num_cam_x; col++) {
                        var cell = $scope.vm.camerasQuadrator.cells[row][col];
                        if (cell.camera && cell.camera.unique_id === eventData.camera_id)
                            cameras.push(cell.camera);
                    }

                if (!cameras.length) return;

                cameras.forEach(function (camera) {
                    if (eventData.isStarted) {
                        camera.events.push(eventData);
                    }
                    if (eventData.isFinished) {
                        var event = camera.events.filter(function (event) {
                            return event.id === eventData.id;
                        })[0];
                        if (event) {
                            camera.events = camera.events.filter(function (event) {
                                return event.id !== eventData.id;
                            });

                            if (eventData.reaction === '-1' && $scope.vm.confidence <= eventData.confidence) {
                                camera.noReactionEvents.push(eventData);
                            }
                        }
                    }

                    checkLatestEvents(camera);

                    if (camera) {
                        camera.withWarning = true;
                    }
                });
            });
        }
    });


    $scope.securityReaction = function (reaction, camera) {
        if (!camera.events) return;
        WebSocketService.sendReaction({
            reaction: reaction,
            camera_id: camera.unique_id,
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

    $scope.openEvent = function (camera) {
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
                camera['unique_id'] +
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
    var toggleFullScreen = function (open) {

        console.log(open);

        var elem = document.body;

        if (open &&
            (document.fullScreenElement !== undefined &&
                document.fullScreenElement === null ||
                document.msFullscreenElement !== undefined &&
                    document.msFullscreenElement === null ||
                document.mozFullScreen !== undefined && !document.mozFullScreen ||
                document.webkitIsFullScreen !== undefined &&
                    !document.webkitIsFullScreen)
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

    $scope.setFullScreenMode = function () {
        toggleFullScreen(document.webkitFullscreenEnabled || document.fullscreenEnabled);
    };
    $scope.removeFullScreenMode = function () {
        toggleFullScreen(document.webkitFullscreenEnabled || document.fullscreenEnabled);
    };

    $scope.setSelectedCamera = function (camera) {
        $scope.vm.selectedCamera = camera;
        $timeout(function () {
            $scope.iniSvgMask();
        });
    };

    $scope.closeSelectedCamera = function () {
        $scope.vm.selectedCamera = false;
        $timeout(function () {
            $scope.iniSvgMask();
        });
    };

    $scope.onSelectDanger = function (value) {
        for (var row = 0; row < $scope.vm.camerasQuadrator.num_cam_y; row++)
            for (var col = 0; col < $scope.vm.camerasQuadrator.num_cam_x; col++) {
                var cell = $scope.vm.camerasQuadrator.cells[row][col];
                if (cell && cell.camera)
                    checkLatestEvents(cell.camera);
            }
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

    var getNewTime = function () {
        $scope.date = new Date(startServerDateTime + new Date().getTime() - startLocalDateTime);
    };

    var dateTimeInterval = $interval(getNewTime, 200);

    $scope.$on('$destroy', function () {
        $interval.cancel(dateTimeInterval);
    });

    $scope.openActiveCamera = function ($event) {
        window.open('/active-camera', 'newwindow', 'menubar=no,location=no,resizable=yes,scrollbars=no,status=yes');
        $event.preventDefault();
    };
});
