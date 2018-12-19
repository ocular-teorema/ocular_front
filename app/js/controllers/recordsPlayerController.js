
angular
    .module('app')
    .controller('recordsPlayerController',
        function($q, $scope, $rootScope, $filter, $state, RecordsService, $timeout, MonitoringService, EventsDescription) {


            $scope.pageStateParams = {
                cuteMode: false
            };

            $scope.toggleCuteMode = function() {
                // $scope.pageStateParams['cuteMode'] = !$scope.pageStateParams['cuteMode'];
            };

            $scope.filters = $state.params['filters'] ? JSON.parse($state.params['filters']) : {};

            var cameraArchivePostfix = $state.params['post'];
            var pathes = cameraArchivePostfix.split('/');
            var lastPath = pathes[pathes.length - 1];
            var splittedSuffix = lastPath.split('___');
            var timeSuff = splittedSuffix[1];
            var nameAndDate = splittedSuffix[0].split('_');
            var splittedTime = timeSuff.split('_');
            var camName = nameAndDate[0];
            var dateDay = nameAndDate[1];
            var dateMonth = nameAndDate[2] - 1;
            var dateYear = nameAndDate[3];

            $scope.displayingList = [{
                label: "высокий",
                value: 80
            }];

            if ($rootScope.currentUser.is_organization_admin) {
                $scope.displayingList = $scope.displayingList.concat([{
                    label: "средний и высокий",
                    value: 50
                }, {
                    label: "все уровни",
                    value: 0
                }
                ]);
            }
            /* Режимы просмотра квадраторов (количество камер на экране) */
            var modesParams = {0: 1, 1: 2, 2: 4, 3: 16, 4: 25, 5:13, 6:9, 7:12};

            $scope.date = new Date(dateYear, dateMonth, dateDay, splittedTime[0], splittedTime[1], splittedTime[2]);
            var currentDateTime = angular.copy($scope.date);
            $scope.userCameras = angular.copy($rootScope.userCameras);
            var camerasList = [];
            $scope.userCameras.groups.map(function(group) {
                var cameras = group.cameras;
                cameras.map(function(cam) {

                    var parser = document.createElement('a');
                    parser.href = cam.events_url;
                    cam.archive_url = 'http://' + parser.hostname + ':8080';
                    cam.info_url = 'http://' + parser.host;
                    // iframe.attr('src', '/video.html?video=' + encodeURIComponent('http://' + parser.hostname +':8080/cam' + camera['id'] + '/alertFragments/alert' + event.id + '.mp4'));
                    camerasList.push(cam);
                });
            });

            var defaultCamera = {
                mode: 0,
                name: 'Выберите набор',
                disabled: true,
                cameras: camerasList.filter(function(cam) {
                    return 'cam' + cam.id === camName;
                })
            };

            $scope.currentQuadrator = defaultCamera;

            var iniEvents = function(camera) {
                camera['events']['events'].map(function(event) {
                    var maxPosition = 990;
                    event['eventLinePosition'] = maxPosition * parseInt(Math.max(0, event['offset'])) / (camera['video']['duration'] || 6000);

                    if (event['eventLinePosition'] > maxPosition) {
                        event['invisible'] = true;
                    }

                    event['eventLineWidth'] = Math.min(
                        990 * (event['endTimeMS'] - event['startTimeMS']) / 1000 / (camera['video']['duration'] || 6000),
                        990 - event['eventLinePosition']
                    );

                    event['eventLineDescription'] = MonitoringService.getEventInfo(event['eventType']);
                    switch(event['reaction']) {
                        case '2':
                            event['eventLineType'] = 'false';
                            break;
                        case '1':
                            event['eventLineType'] = 'ealert';
                            break;
                        case '-1':
                            event['eventLineType'] = 'noreact';
                            break;
                    }
                });
            };


            $scope.initVideo = function(player, camera) {
                var endDate = new Date();
                endDate.setTime(currentDateTime.getTime() + 10 * 60 * 1000);

                var getStat = function() {
                    RecordsService.getStatistics(
                        $filter('date')(currentDateTime, 'yyyy-MM-d'),
                        $filter('date')(endDate, 'yyyy-MM-d'),
                        $filter('date')(currentDateTime, 'HH-mm'),
                        $filter('date')(endDate, 'HH-mm'),
                        camera
                    ).then(function(stat) {
                        console.log(arguments);
                        camera['events'] = {events: []};
                        stat.data.map(function(eventOneDay) {
                            camera['events']['events'] = camera['events']['events'].concat(eventOneDay.events);
                        });
                        iniEvents(camera);
                        $scope.applyConfidenceLevel();
                    });
                };

                player = player.get(0);
                player.autoplay = false;
                player.currentTime = 0;
                player.muted = true;
                var regExp = new RegExp(camName, 'g');

                var parser = document.createElement('a');
                parser.href = camera.events_url;
                var src = 'http://' + parser.hostname + ':8080';

                camera.loadedVideo = false;
                camera.loadedmetadata = false;
                camera.loadedmetaerror = false;

                player.onerror = function() {
                    camera.loadedVideo = true;
                    camera.loadedmetadata = false;
                    camera.loadedmetaerror = true;
                    $scope.$apply();
                    getStat();
                };

                player.onloadedmetadata = function() {
                    camera['loadedVideo'] = true;
                    camera['loadedmetadata'] = true;
                    camera['loadedmetaerror'] = false;
                    var lastTime = $scope['currentQuadrator']['cameras'].find(function(camera) {
                        return !!camera['video'];
                    });
                    lastTime = lastTime ? lastTime['video']['currentTime'] : 0;
                    $scope.currentQuadrator.cameras.map(function(cam) {
                        if (cam.video) {
                            cam.video.playbackRate = $scope.selectedOptions.speed;
                        }
                        if (cam.video && (cam.video.currentTime >= lastTime)) {
                            lastTime = Math.max(lastTime, cam.video.currentTime);
                            mainPlayer = cam.video;
                        }
                    });
                    player.currentTime = lastTime;
                    !globalPaused ? player.play() : false;
                    getStat();
                    $scope.$apply();
                };
                player.src = src + $state.params['post'].replace(regExp, 'cam' + camera.id) + '.mp4';
                camera.video = player;

            };

            $scope.filters.confidence = !isNaN($scope.filters.confidence) ? $scope.filters.confidence : $scope.displayingList[0]['value'];

            $scope.$watch('filters.confidence', function(oldValue, newValue) {
                if ($scope.filters.confidence === undefined) return;
                $scope.applyConfidenceLevel();
            });


            $scope.applyFilters = function() {
                $scope.applyConfidenceLevel();
            };

            var checkEvents = function(camera) {
                camera['events']['falses'] = 0;
                camera['events']['noreacts'] = 0;
                camera['events']['alerts'] = 0;

                camera['events']['events'].map(function(ev) {

                    ev['noreacts'] = ev['reaction'] == '-1';
                    ev['efalse'] = ev['reaction'] == '2';
                    ev['alerts'] = ev['reaction'] == '1';


                    ev['motion'] = ev.eventType == EventsDescription.ALERT_TYPE_AREA;
                    ev['leave_object'] = ev.eventType == EventsDescription.ALERT_TYPE_STATIC_OBJECT;
                    ev['velocity'] = ev.eventType == EventsDescription.ALERT_TYPE_VELOCITY;
                    ev['wrong_direction'] = ev.eventType == EventsDescription.ALERT_TYPE_INVALID_MOTION;
                    ev['calibration_error'] = ev.eventType == EventsDescription.ALERT_TYPE_CALIBRATION_ERROR;
                    ev['many_people'] = ev.eventType == EventsDescription.ALERT_TYPE_PEOPLE_COUNT;
                    ev.isVisible = ((camera['analysis'] == 1) ||
                        (
                        (($scope.filters.motion && ev.motion) ||
                        ($scope.filters.leave_object && ev.leave_object) ||
                        ($scope.filters.velocity && ev.velocity) ||
                        ($scope.filters.wrong_direction && ev.wrong_direction) ||
                        ($scope.filters.many_people && ev.many_people) ||
                        ($scope.filters.calibration_error && ev.calibration_error)))) && ($scope.filters.confidence <= ev.confidence);
                    ev.isVisible = ev.isVisible || !$rootScope.currentUser.is_organization_admin;

                    camera['events']['falses']+= (ev.isVisible && ev['efalse']) ? 1 : 0;
                    camera['events']['noreacts']+= (ev.isVisible && ev['noreacts']) ? 1 : 0;
                    camera['events']['alerts']+= (ev.isVisible && ev['alerts']) ? 1 : 0;
                });
                camera['isActiveView'] = $scope.filters.noevents || !!camera['events']['events'].filter(function(ev) {
                        return ev.isVisible;
                    }).length;

            };
            $scope.applyConfidenceLevel = function() {
                $scope.currentQuadrator.cameras.map(function(camera) {
                    if (!camera['events']) return;
                    checkEvents(camera);
                });
                $scope.withAnalysis = !!$scope.currentQuadrator.cameras.filter(function(cam) {
                    return cam.analysis != 1;
                }).length;
            };

            var isNext = function(toNext, prevDefer) {
                var camera = angular.copy(camerasList.filter(function(camera) {
                    return 'cam' + camera.id === camName
                })[0]);
                if (!camera) return;

                var minutes = toNext ? 10 : -10;

                $scope.searchDate = $scope.searchDate || angular.copy(currentDateTime);
                $scope.searchDate.setTime($scope.searchDate.getTime() + minutes * 60 * 1000);

                var defer = prevDefer || $q.defer();

                if ($scope.searchDate.getTime() >= (new Date()).getTime()) {
                    defer.resolve(false);
                    return;
                }

                var endDate = new Date();
                endDate.setTime($scope.searchDate.getTime() + 10 * 60 * 1000);

                RecordsService.getStatistics(
                    $filter('date')($scope.searchDate, 'yyyy-MM-d'),
                    $filter('date')(endDate, 'yyyy-MM-d'),
                    $filter('date')($scope.searchDate, 'HH-mm'),
                    $filter('date')(endDate, 'HH-mm'),
                    camera
                ).then(function (stat) {
                    camera['events'] = {
                        events: []
                    };
                    stat.map(function (eventOneDay) {
                        camera['events']['events'] = camera['events']['events'].concat(eventOneDay.events);
                    });
                    checkEvents(camera);
                    if (camera.isActiveView) {
                        defer.resolve({
                            camera: camera,
                            startTime: $scope.searchDate
                        });
                    } else {
                        isNext(toNext, defer);
                    }
                }, function(response) {
                    isNext(toNext, defer);
                });
                return defer;
            };

            $scope.stopSearch = function() {
                searchDefer ? searchDefer.resolve(false) : false;
            };
            var searchDefer;

            var toNewTimeInterval = function(toNextPage) {
                $rootScope.prevQuadrator = angular.copy($scope.currentQuadrator);
                $scope.searchNextVideo = true;
                $scope.stopSearch();
                searchDefer = isNext(toNextPage);
                searchDefer.promise.then(function(result) {
                    $scope.searchNextVideo = false;
                    searchDefer = false;
                    if (result.camera) {
                        var newPostfixSuffics = pathes.filter(function(path) {
                            return path != pathes[pathes.length - 1]
                        });
                        newPostfixSuffics.push(
                            camName + '_' + $filter('date')(result.startTime, 'dd_MM_yyyy') + '___' +
                            $filter('date')(result.startTime, 'HH_mm_ss')
                        );
                        $state.go($state.current.name, {
                            post: newPostfixSuffics.join('/'),
                            filters: JSON.stringify($scope.filters),
                            speed: $scope.selectedOptions.speed
                        });
                    }
                });
            };

            $scope.nextTimeRange = function() {
                toNewTimeInterval(true);
            };

            $scope.prevTimeRange = function() {
                toNewTimeInterval();
            };



            $scope.$watch('currentQuadrator.cameras', function(newQuadrator, oldQuadrator) {
                $scope.usedCamerasOfQuadrator = [];

                if (oldQuadrator) {
                    oldQuadrator.map(function(cam) {
                        if (cam.video) {
                            angular.element(cam.video).remove();
                        }
                    });
                }

                if (newQuadrator) {
                    newQuadrator.map(function(item) {
                        $scope.usedCamerasOfQuadrator.push(item.id);
                    });
                }
            });


            if ($rootScope.prevQuadrator) {
                $scope.currentQuadrator.mode = $rootScope.prevQuadrator.mode;
                var cameras = [];
                $scope.currentQuadrator.cameras = [];
                $rootScope.prevQuadrator.cameras.map(function(prevCam){
                    cameras.push(camerasList.find(function(cam) {
                        return cam.id === prevCam.id
                    }));
                });

                $scope.currentQuadrator.cameras = cameras;
                $rootScope.prevQuadrator = false;
            }

            var updateDate = function() {
                $scope.date.setTime(currentDateTime.getTime() + Math.round(1000 * mainPlayer.currentTime));
                $scope.$apply();
            };

            $scope.speedOptionsList = [
                {
                    value: 1,
                    label: 'Без ускорения'
                }, {
                    value: 4,
                    label: 'X4'
                }, {
                    value: 8,
                    label: 'X8'
                }, {
                    value: 16,
                    label: 'X16'
                }, {
                    value: 0.5,
                    label: 'X0.5'
                }
            ];

            $scope.$watch('selectedOptions.speed', function(newValue, oldValue) {
                if (newValue === oldValue) return;
                $scope.currentQuadrator.cameras.map(function(cam) {
                    cam.video.playbackRate = $scope.selectedOptions.speed;
                });
            });

            $scope.selectedOptions = {
                speed: $state.params['speed'] || 1
            };


            var mainPlayer;

            var interval = setInterval(function() {
                if (mainPlayer) {
                    if (mainPlayer.currentTime === mainPlayer.duration) {
                        return $scope.nextTimeRange();
                    }
                    updateDate();
                    var rangeTime = 1000 * mainPlayer.currentTime / mainPlayer.duration;
                    angular.element('img.slider').css('left', rangeTime);
                }
            }, 100);

            $scope.$on('$destroy', function() {
                clearInterval(interval);
            });

            $scope.timeMarks = [];
            var dateTime = new Date();
            for (var k = 1; k < 10; k++) {
                dateTime.setTime(currentDateTime.getTime() + k*60000);
                $scope.timeMarks.push($filter('date')(dateTime, 'HH:mm'));
            }

            $scope.onStartDrag = function() {
                $scope.currentQuadrator.cameras.map(function(cam) {
                    cam.video.pause();
                });
            };
            $scope.onDrag = function(event, ui, currVideo) {
                var min = 0;
                var max = 1000;
                if (ui.position.left < min) {
                    ui.position.left = min;
                }
                if (ui.position.left > max) {
                    ui.position.left = max;
                }
                angular.element('img.slider').css('left', 1000 * (ui.position.left / max ) * currVideo.duration);
                $scope.currentQuadrator.cameras.map(function(cam) {
                    cam.video.currentTime = (ui.position.left / max ) * cam.video.duration;
                });
            };
            $scope.onStopDrag = function() {
                globalPaused = false;
                $scope.currentQuadrator.cameras.map(function(cam) {
                    if (cam.video) {
                        cam.video.play();
                    }
                });
            };
            $scope.onClickLine = function(e, element, video) {
                var max = 1000;
                var target = e.pageX - element.offset().left;
                $scope.currentQuadrator.cameras.map(function(cam) {
                    if (cam.video && cam.loadedmetadata) {
                        cam.video.currentTime = (target / max ) * cam.video.duration;
                        if (cam.video.paused) {
                            cam.video.play();
                        }
                    }
                });
                angular.element('img.slider').css('left', 1000 * video.currentTime / video.duration);
            };
            /* Отображение/скрытие каталога для камеры */
            var showedCameraCategories = false;
            var activeGroup;
            $scope.showCameraCategories = function(camera) {
                if (showedCameraCategories != camera) {
                    hideCameraCategories();
                    camera.showedCategories  = true;
                    showedCameraCategories = camera;
                } else {
                    hideCameraCategories();
                }
            };
            var hideCameraCategories = function() {
                if (activeGroup) {
                    activeGroup.active = false;
                    activeGroup = false;
                }
                if (showedCameraCategories) {
                    showedCameraCategories.showedCategories = false;
                }
                showedCameraCategories = false;
            };

            $scope.showCategoryInCatalog = function(group) {
                if (activeGroup) {
                    activeGroup.active = false;
                }
                if (activeGroup != group) {
                    (activeGroup = group)['active'] = true;
                } else {
                    activeGroup = false;
                }
            };

            var globalPaused = false;
            $scope.startStopVideos = function() {
                if (globalPaused) {
                    globalPaused = false;
                    $scope.currentQuadrator.cameras.map(function(cam) {
                        cam.video.play();
                    });
                } else {
                    globalPaused = true;
                    $scope.currentQuadrator.cameras.map(function(cam) {
                        cam.video.pause();
                    });
                }
            };


            /* Выбор камеры из каталога */
            $scope.setCamera = function(newCamera, oldCamera) {
                $scope.currentQuadrator.cameras[$scope.currentQuadrator.cameras.indexOf(oldCamera)] = angular.copy(newCamera);
                $scope.usedCamerasOfQuadrator[$scope.usedCamerasOfQuadrator.indexOf(oldCamera.id)] = newCamera.id;
            };

            $scope.setViewMode = function(mode) {
                hideCameraCategories();
                if ($scope.currentQuadrator.mode == mode) return;
                var noVisibleCameras = angular.copy(camerasList.filter(function(camera) {
                    return $scope.currentQuadrator.cameras.find(function(cam) {
                        return cam.id == camera.id;
                    });
                }));
                noVisibleCameras = noVisibleCameras.concat(angular.copy(camerasList).filter(function(cam) {
                    return !noVisibleCameras.find(function(searchedCam) {
                        return cam.id == searchedCam.id;
                    })
                }));
                $scope.currentQuadrator.cameras = [];
                $timeout(function() {
                    $scope.currentQuadrator.cameras = noVisibleCameras.slice(0, modesParams[mode]);
                });
                $scope.currentQuadrator.mode = mode;
                $scope.openCams = false;
            };

        }
    ).directive('ngVideo',
    function() {
        return {
            'restrict': 'A',
            'scope': {
                ngVideo: '='
            },
            'controller': function ($scope) {

            },
            'link': function ($scope, element) {
                var video = false;
                var iniContainer = function() {
                    var video = angular.element('<video muted="muted"></video>').appendTo(element);
                    $scope.$parent.initVideo(video, $scope.ngVideo);
                };
                $scope.$watch('ngVideo', function(newV, oldV) {
                    if (newV == oldV) return;
                    if (oldV.video) {
                        angular.element(oldV.video).empty().remove();
                    }
                    iniContainer();
                });
                iniContainer();
            }
        }
    }).directive('ngVideoLine',
    function() {
        return {
            'restrict': 'A',
            'scope': {
                'ngVideoLine': '='
            },
            'link': function($scope, element) {
                var draggableElement = angular.element('.slider:first', element);
                draggableElement.draggable({
                    axis: 'x',
                    start: $scope.$parent.onStartDrag,
                    drag: function(event, ui) {
                        $scope.$parent.onDrag(event, ui, $scope.ngVideoLine.video);
                    },
                    stop: $scope.$parent.onStopDrag
                });
                element.click(function(e) {
                    $scope.$parent.onClickLine(e, element, $scope.ngVideoLine.video);
                });
            }
        }
}).directive('ngCuteLine',
    function() {
        return {
            'restrict': 'A',
            'scope': {
                'ngCuteLine': '='
            },
            'link': function($scope, element) {
                var draggableElement = angular.element('.cute-line-limit', element);
                var states = {};
                var offset = 8;
                draggableElement.draggable({
                    axis: 'x',
                    start: function() {

                    },
                    drag: function(event, ui) {
                        var limit = angular.element(event.target).data('limit');
                        switch(limit) {
                            case 'left':
                                ui.position.left = Math.max(0, ui.position.left);
                                ui.position.left = Math.min(ui.position.left, states['right'] ? states['right'].left + offset: element.width());
                                break;
                            case 'right':
                                ui.position.left = Math.max((states['left'] ? states['left'].left : 0) - offset, ui.position.left);
                                ui.position.left = Math.min(ui.position.left, element.width() - 2 * offset);
                                break;
                        }
                    },
                    stop: function(event, ui) {
                        states[angular.element(event.target).data('limit')] = ui.position;
                    }
                });

                element.click(function(e) {

                });
            }
        }
    });
