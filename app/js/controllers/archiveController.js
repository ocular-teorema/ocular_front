
angular
    .module('app')
    .controller('archiveController',
        function ($scope, ArchiveService, $filter, $rootScope, EventsDescription, ServersService, $timeout, userCameras) {
            //res.data.fact_address

            $scope.eventsDescription = EventsDescription;
            $scope.recordsMode = 'archive';
            $scope.isCameraFilterShow = true;
            $scope.isEventFilterShow = true;
            $scope.servers = [];
            $scope.selectedCameras = [];
            $scope.toggleMode = function (mode) {
                $scope.recordsMode = mode;
                //$scope.applyFilters();

                //if ($scope.recordsMode === 'journal') {
                //    getEvents();
                //}
            };

            $scope.timeInterval = 0;

            var loadStats = function (server) {
                var selectedCameras = $scope.selectedCameras.filter(function (sc) { return sc.camera.server === server.id; });
                if (selectedCameras.length > 0) {
                    var selectedRefs = selectedCameras
                        .filter(function (cameraRef) { return cameraRef.camera && cameraRef.camera.id; })
                        .map(function (cameraRef) { return cameraRef.camera.id; });
                    server.loadingStats = true;
                    if (selectedRefs.length > 0) {
                        var startTs = $scope.interval.startDate.getTime();
                        var endTs = $scope.interval.endDate.getTime();
                        ArchiveService.getStatistics(
                            server.address,
                            startTs,
                            endTs,
                            selectedRefs
                        ).then(function (resp) {
                            $scope.timeInterval = endTs - startTs;

                            server.stats = resp.data;
                            server.loadingStats = false;
                        });
                    }
                } else {
                    server.stats = {};
                }
            };

            var loadEvents = function (server, skip) {
                debugger;
                if (skip === 0)
                    server.events = [];
                var selectedCameras = $scope.selectedCameras.filter(function (sc) { return sc.camera.server === server.id; });
                if (selectedCameras.length > 0) {
                    var selectedRefs = selectedCameras
                        .filter(function (cameraRef) { return cameraRef.camera && cameraRef.camera.id; })
                        .map(function (cameraRef) { return cameraRef.camera.id; });
                    if (selectedRefs.length > 0) {
                        server.loadingEvents = true;
                        ArchiveService.getEvents(
                            server.address,
                            $scope.interval.startDate.getTime(),
                            $scope.interval.endDate.getTime(),
                            selectedRefs,
                            $scope.filters,
                            skip
                        ).then(function (resp) {
                            server.events.push(...resp.data);
                            server.loadingEvents = false;
                        });
                    }
                } else {
                    server.events = [];
                }
            };

            /* Список всех доступных камер */

            $scope.userCameras = angular.copy($rootScope.userCameras);

            $scope.userCameras.groups.map(function (group) {
                var cameras = group.cameras;
                cameras.map(function (cam) {
                    var parser = document.createElement('a');
                    parser.href = cam.events_url;
                    cam.archive_url = parser.protocol + '//' + parser.hostname + ':8080';


                    cam.thumb_url_record = parser.protocol + '//' + parser.hostname + ':8080/cam' + cam['id'] + '/thumb.jpg';

                    cam.info_url = cam.analysis === 1 ? '' : 'http://' + parser.host;
                    // iframe.attr('src', '/video.html?video=' + encodeURIComponent('http://' + parser.hostname +':8080/cam' + camera['id'] + '/alertFragments/alert' + event.id + '.mp4'));
                    //camerasList.push(cam);
                });
            });

            // $scope.archivePort = ServerConfiguration.ARCHIVE_PORT;
            var moNow = moment();
            var nowDate = moNow.toDate();
            var startDate = moNow.subtract(24, 'hours').toDate();

            //            var statParams = window.localStorage && window.localStorage['statParams'] ? JSON.parse(window.localStorage['statParams']) : {};
            //            var allFilters = window.localStorage && window.localStorage['statFilters'] ? JSON.parse(window.localStorage['statFilters']) : {};

            $scope.filters = {
                //                "noevents": true,
                //                "false": true,
                "react": true,
                "noreact": true,
                //                "alerts": true,
                "motion": true,
                //                "leave_object": true,
                "velocity": true,
                "wrong_direction": true,
                "calibration_error": true,
                "confidence": {
                    "low": true,
                    "medium": true,
                    "high": true
                }
            };


            //if (!$rootScope.currentUser.is_organization_admin) {
            //    for (var i in defaultSecurityFilters) {
            //        allFilters[i] = defaultSecurityFilters[i];
            //    }
            //}
            $scope.interval = { startDate: startDate, endDate: nowDate };

            $scope.startDateBeforeRender = function ($dates) {
                const todayMidnight = moment().endOf('day').toDate();
                $dates.filter(function (date) {
                    return date.utcDateValue > todayMidnight.getTime();
                }).forEach(function (date) {
                    date.selectable = false;
                });
            };

            /*** Update of filters ***/
            $scope.$watch('interval.startDate', function (n) {
                if (n) {
                    $timeout(function () {
                        var date = $scope.interval.startDate;
                        if (date > $scope.interval.endDate) {
                            $scope.interval.endDate = date;
                        }
                        for (var i = 0; i < $scope.servers.length; i++) {
                            loadStats($scope.servers[i]);
                            loadEvents($scope.servers[i], 0);
                        }
                    });
                }
            });
            $scope.$watch('interval.endDate', function (n) {
                if (n) {
                    $timeout(function () {
                        var date = $scope.interval.endDate;
                        if (date < $scope.interval.startDate) {
                            $scope.interval.startDate = date;
                        }
                        for (var i = 0; i < $scope.servers.length; i++) {
                            loadStats($scope.servers[i]);
                            loadEvents($scope.servers[i], 0);
                        }
                    });
                }
            });

            $scope.setSettings = function () {
                for (var i = 0; i < $scope.servers.length; i++) {
                    loadEvents($scope.servers[i], 0);
                }
            };

            $scope.camerasGroups = angular.copy($rootScope.camerasGroups);

            $scope.addCamera = function () {
                // getting first existing camera which isn't added yet
                for (var i = 0; i < $scope.userCameras.groups.length; i++) {
                    var group = $scope.userCameras.groups[i];
                    for (var j = 0; j < group.cameras.length > 0; j++) {
                        var cam = group.cameras[j];
                        if (!$scope.selectedCameras.filter(function (sc) { return sc.camera.id === cam.id; })[0]) {
                            $scope.setCameraModel(group, group.cameras[j]);
                            return;
                        }
                    }
                }
            };

            $scope.deleteCamera = function (index) {
                var selectedCamera = $scope.selectedCameras[index];
                $scope.selectedCameras.splice(index, 1);
                loadStats(selectedCamera.server);
                loadEvents(selectedCamera.server, 0);
            };

            var scrollTestDiv = angular.element('<div>').css({ overflow: 'scroll' });
            var noScrolled = angular.element('<div>').appendTo(scrollTestDiv);
            angular.element('body').append(scrollTestDiv);
            var scrollSize = scrollTestDiv.width() - noScrolled.width();
            scrollTestDiv.detach().remove();

            var datesList = angular.element('#datesList');
            var eventsList = angular.element('#eventsList');
            datesList.parent().css({
                marginBottom: scrollSize
            });
            var eventsListHandler = function (e) {
                if (!eventsListIsFocused) {
                    datesListIsFocused = true;
                    datesList.scrollTop(eventsList.scrollTop());
                } else {
                    eventsListIsFocused = false;
                }
            };
            var datesListHandler = function (e) {
                if (!datesListIsFocused) {
                    eventsListIsFocused = true;
                    eventsList.scrollTop(datesList.scrollTop());
                } else {
                    datesListIsFocused = false;
                }
            };

            datesList.on('scroll', datesListHandler);
            eventsList.on('scroll', eventsListHandler);

            var eventsListIsFocused = false;
            var datesListIsFocused = false;

            $scope.setCameraModel = function (group, camera) {
                var srv = $scope.servers.filter(function (s) { return s.id === camera.server; })[0];
                if (srv) {
                    $scope.selectedCameras.push({ server: srv, group: group, camera: camera });
                    loadStats(srv);
                    loadEvents(srv, 0);
                } else {
                    ServersService.getServer(camera.server).then(function (res) {
                        var newServer = {
                            id: camera.server,
                            address: res.data.fact_address,
                            events: [],
                            stats: {}
                        };
                        $scope.selectedCameras.push({ server: newServer, group: group, camera: camera });
                        $scope.servers.push(newServer);
                        loadStats(newServer);
                        loadEvents(newServer, 0);
                    });
                }
            };

            $scope.getStats = function (name, level) {
                var result = 0;
                for (var i = 0; i < $scope.servers.length; i++) {
                    var val = $scope.servers[i].stats[name];
                    if (val) {
                        if (level)
                            val = val[level];
                        result += val;
                    }
                }
                return result;
            };

            $scope.cameraEventsFilter = function (cameraId) {
                return function (event) {
                    return event.cam === 'cam' + cameraId;
                };
            };

            $scope.calculateEventPosition = function (event) {
                return (event.startTs - $scope.interval.startDate.getTime()) * 100 / $scope.timeInterval;
            };

            $scope.calculateEventWidth = function (event) {
                return (event.endTs - event.startTs) * 100 / $scope.timeInterval;
            };

            $scope.eventConfidenceClass = function (event) {
                if (event.conf < 50)
                    return 'confidence-low';
                if (event.conf >= 80)
                    return 'confidence-high';
                return 'confidence-medium';
            };

            $scope.addCamera();
        }
    );

