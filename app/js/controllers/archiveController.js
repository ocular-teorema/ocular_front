
angular
    .module('app')
    .controller('archiveController',
        function ($scope, ArchiveService, $filter, $rootScope, EventsDescription, ServersService, $timeout, userCameras, $uibModal) {
            var lastSeek = 0;
            $scope.eventsDescription = EventsDescription;
            $scope.recordsMode = 'archive';
            $scope.isCameraFilterShow = true;
            $scope.isEventFilterShow = true;
            $scope.servers = [];
            $scope.selectedCameras = [];
            $scope.loadArchiveVideosPending = false;
            $scope.playbackRate = 1;
            $scope.downloadCameraRef = null;
            $scope.toggleMode = function (mode) {
                $scope.recordsMode = mode;
                if ($scope.recordsMode === 'archive' && $scope.loadArchiveVideosPending) {
                    for (var i = 0; i < $scope.servers.length; i++)
                        loadArchiveVideos($scope.servers[i], 0);
                }
            };

            $scope.timeMarks = [];
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
                            $scope.timeMarks = [];
                            for (var k = 0; k <= 10; k++) {
                                var dateTime = new Date(startTs + k * $scope.timeInterval / 10);
                                $scope.timeMarks.push($filter('date')(dateTime, 'MM/dd HH:mm'));
                            }

                            server.stats = resp.data;
                            server.loadingStats = false;
                        });
                    }
                } else {
                    server.stats = {};
                }
            };

            var loadArchiveVideos = function (server, skip) {
                if ($scope.recordsMode !== 'archive') {
                    $scope.loadArchiveVideosPending = true;
                    return;
                }
                else {
                    $scope.loadArchiveVideosPending = false;
                }
                setTimeout(function () {
                    var selectedCameras = $scope.selectedCameras.filter(function (sc) { return sc.camera.server === server.id; });
                    if (selectedCameras.length > 0) {
                        if (skip === 0) {
                            for (var i = 0; i < $scope.selectedCameras.length; i++) {
                                $scope.selectedCameras[i].video.pause();
                                $scope.selectedCameras[i].video.innerHTML = '';
                            }
                        }
                        var selectedRefs = selectedCameras
                            .filter(function (cameraRef) { return cameraRef.camera && cameraRef.camera.id; })
                            .map(function (cameraRef) { return cameraRef.camera.id; });
                        if (selectedRefs.length > 0) {
                            server.loadingEventVideos = false;
                            ArchiveService.getArchiveVideos(
                                server.address,
                                $scope.interval.startDate.getTime(),
                                $scope.interval.endDate.getTime(),
                                selectedRefs,
                                skip
                            ).then(function (resp) {
                                var cameraMap = {};
                                for (var c = 0; c < $scope.selectedCameras.length; c++) {
                                    cameraMap['cam' + $scope.selectedCameras[c].camera.id] = $scope.selectedCameras[c];
                                    $scope.selectedCameras[c].records = [];
                                }

                                for (var i = 0; i < resp.data.length; i++) {
                                    var record = resp.data[i];
                                    if (record.fileSize > 0) {
                                        record.src = 'http://' + cameraMap[record.cam].server.address + ':8080' + record.archivePostfix;
                                        record.startTs = julianIntToDate(record.date);// - timezoneOffsetMs;
                                        record.endTs = record.startTs + record.end;
                                        record.startTs += record.start;
                                        cameraMap[resp.data[i].cam].records.push(record);
                                    }
                                }

                                $scope.seek(0);
                                //for (c = 0; c < $scope.selectedCameras.length; c++) {
                                //    $scope.selectedCameras[c].video.play();
                                //}
                                server.loadingEventVideos = false;
                            });
                        }
                    }
                }, 0);
            };

            var loadEvents = function (server, skip) {
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

            function julianIntToDate(JD) {
                var y = 4716;
                var v = 3;
                var j = 1401;
                var u = 5;
                var m = 2;
                var s = 153;
                var n = 12;
                var w = 2;
                var r = 4;
                var B = 274277;
                var p = 1461;
                var C = -38;
                var f = JD + j + Math.floor((Math.floor((4 * JD + B) / 146097) * 3) / 4) + C;
                var e = r * f + v;
                var g = Math.floor((e % p) / r);
                var h = u * g + w;
                var D = Math.floor((h % s) / u) + 1;
                var M = ((Math.floor(h / s) + m) % n) + 1;
                var Y = Math.floor(e / p) - y + Math.floor((n + m - M) / n);
                return Date.parse(new Date(Y, M - 1, D));
            }

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
                            loadArchiveVideos($scope.servers[i], 0);
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
                            loadArchiveVideos($scope.servers[i], 0);
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
                            var newCameraRef = {
                                server: null,
                                group: group,
                                camera: group.cameras[j]
                            };
                            $scope.setCameraModel(group.cameras[j], null, newCameraRef, null, true);
                            return;
                        }
                    }
                }
            };

            $scope.deleteCamera = function (index) {
                var selectedCamera = $scope.selectedCameras[index];
                $scope.selectedCameras.splice(index, 1);
                loadStats(selectedCamera.server);
                //loadArchiveVideos(selectedCamera.server, 0);
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

            // With requestAnimationFrame, we can ensure that as 
            // frequently as the browser would allow, 
            // the video is resync'ed.
            function sync() {
                var player = $scope.selectedCameras[0].video;
                for (var i = 1; i < $scope.selectedCameras.length; i++) {
                    if ($scope.selectedCameras[i].video.readyState === 4) {
                        $scope.selectedCameras[i].video.currentTime = player.currentTime;
                        try {
                            if ($scope.playbackRate > 0)
                                $scope.selectedCameras[i].video.play();
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }

                if (!player.paused) {
                    requestAnimationFrame(sync);
                }
            }

            var onPlay = function () {
                for (var i = 1; i < $scope.selectedCameras.length; i++) {
                    try {
                        $scope.selectedCameras[i].video.play();
                    } catch (e) {
                        console.log(e);
                    }
                }

                sync();
            };
            var onPause = function () {
                for (var i = 1; i < $scope.selectedCameras.length; i++) {
                    try {
                        $scope.selectedCameras[i].video.pause();
                    } catch (e) {
                        console.log(e);
                    }
                }
            };
            var onTimeUpdate = function () {
                if (this.paused) {
                    return;
                }
                $scope.currentPlayerTimePercent = $scope.calculateCurrentPlaybackPercent();
                $scope.$apply();
            };

            var onSeeking = function () {
                for (var i = 1; i < $scope.selectedCameras.length; i++) {
                    $scope.selectedCameras[i].video.currentTime = this.currentTime;
                    try {
                        if ($scope.playbackRate > 0)
                            $scope.selectedCameras[i].video.play();
                    } catch (e) {
                        console.log(e);
                    }
                }
                $scope.currentPlayerTimePercent = $scope.calculateCurrentPlaybackPercent();
                $scope.$apply();
            };

            var onEnded = function () {
                for (var i = 0; i < $scope.selectedCameras.length; i++) {
                    var cameraRef = $scope.selectedCameras[i];
                    if (cameraRef.currentRecord) {
                        $scope.seek(cameraRef.currentRecord.endTs - $scope.interval.startDate);
                        break;
                    }
                }
            };

            $scope.calculateCurrentPlaybackPercent = function () {
                var currentRecord = null;
                var video = null;
                for (var i = 0; i < $scope.selectedCameras.length; i++) {
                    currentRecord = $scope.selectedCameras[i].currentRecord;
                    video = $scope.selectedCameras[i].video;
                    if (currentRecord)
                        break;
                }
                if (!currentRecord)
                    return 0;
                $scope.currentPlaybackTime = $filter('date')(new Date(currentRecord.startTs + video.currentTime * 1000), 'HH:mm:ss');

                return Math.floor(100 * (video.currentTime * 1000 + currentRecord.startTs - $scope.interval.startDate.getTime()) / $scope.timeInterval);
            };

            $scope.setCurrentPlayerTime = function (val) {
                for (var i = 0; i < $scope.selectedCameras.length; i++)
                    $scope.selectedCameras[i].video.currentTime = val;
            };

            $scope.setCameraModel = function (camera, values, cameraRef, oldCamera, addNew) {
                function initCamera(cameraRef) {
                    cameraRef.currentRecord = null;
                    cameraRef.videoLoaded = false;
                    setTimeout(function () {
                        $scope.selectedCameras[0].video.playbackRate = $scope.playbackRate;
                        $scope.selectedCameras[0].video.addEventListener("play", onPlay);
                        $scope.selectedCameras[0].video.addEventListener("pause", onPause);
                        $scope.selectedCameras[0].video.addEventListener("timeupdate", onTimeUpdate);
                        $scope.selectedCameras[0].video.addEventListener("seeking", onSeeking);
                        $scope.selectedCameras[0].video.addEventListener("ended", onEnded);

                        loadStats(cameraRef.server);
                        loadArchiveVideos(cameraRef.server, 0);
                        loadEvents(cameraRef.server, 0);
                    }, 0);
                }

                var server = $scope.servers.filter(function (s) { return s.id === camera.server; })[0];
                if (server) {
                    cameraRef.server = server;
                    if (addNew)
                        $scope.selectedCameras.push(cameraRef);
                    initCamera(cameraRef);
                } else {
                    ServersService.getServer(camera.server).then(function (res) {
                        var newServer = {
                            id: camera.server,
                            address: res.data.fact_address,
                            events: [],
                            stats: {}
                        };
                        $scope.servers.push(newServer);
                        cameraRef.server = newServer;
                        if (addNew)
                            $scope.selectedCameras.push(cameraRef);
                        initCamera(cameraRef);
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

            $scope.calculateRecordPosition = function (record) {
                return (record.startTs - $scope.interval.startDate.getTime()) * 100 / $scope.timeInterval;
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

            $scope.initVideo = function (player, cameraRef, event) {
                player = player.get(0);
                player.autoplay = false;
                player.currentTime = 0;
                player.muted = true;

                var src = 'http://' + cameraRef.server.address + ':8080';

                cameraRef.loadedVideo = false;
                cameraRef.loadedmetadata = false;
                cameraRef.loadedmetaerror = false;

                player.onerror = function () {
                    cameraRef.loadedVideo = true;
                    cameraRef.loadedmetadata = false;
                    cameraRef.loadedmetaerror = true;
                    $scope.$apply();
                };

                player.onloadedmetadata = function () {
                    cameraRef['loadedVideo'] = true;
                    cameraRef['loadedmetadata'] = true;
                    cameraRef['loadedmetaerror'] = false;
                    //var lastTime = $scope['currentQuadrator']['cameras'].find(function (camera) {
                    //    return !!camera['video'];
                    //});
                    //lastTime = lastTime ? lastTime['video']['currentTime'] : 0;
                    //$scope.currentQuadrator.cameras.map(function (cam) {
                    //    if (cam.video) {
                    //        cam.video.playbackRate = $scope.selectedOptions.speed;
                    //    }
                    //    if (cam.video && (cam.video.currentTime >= lastTime)) {
                    //        lastTime = Math.max(lastTime, cam.video.currentTime);
                    //        mainPlayer = cam.video;
                    //    }
                    //});
                    //player.currentTime = lastTime;
                    player.currentTime = event.offset;
                    try {
                        if ($scope.playbackRate > 0)
                            element[0].play();
                        else
                            element[0].pause();
                    } catch (e) {
                        console.log(e);
                    }
                    $scope.$apply();
                };
                if (event) {
                    player.src = src + event.archiveStartHint;
                }
                cameraRef.eventVideo = player;

            };

            $scope.openEventVideo = function (event) {
                $scope.isVideoOpened = true;
                $scope.openedCameraRef = $scope.selectedCameras.filter(function (cr) { return 'cam' + cr.camera.id === event.cam; })[0];
                $scope.openedEvent = event;
            };

            $scope.closeEventVideo = function () {
                $scope.isVideoOpened = false;
            };

            $scope.getCamera = function (eventCamId) {
                var cameraRef = $scope.selectedCameras.filter(function (cr) { return 'cam' + cr.camera.id === eventCamId; })[0];
                if (cameraRef && cameraRef.camera)
                    return cameraRef.camera;
                return null;
            };

            $scope.progressClicked = function ($event) {
                var rect = $event.currentTarget.getBoundingClientRect();
                var startTs = $scope.interval.startDate.getTime();
                var endTs = $scope.interval.endDate.getTime();
                $scope.seek(Math.floor((endTs - startTs) * ($event.clientX - rect.left) / rect.width));
            };

            $scope.downloadDialog = function (cameraRef) {
                //$scope.downloadCameraRef = cameraRef;
                var modalInstance = $uibModal.open({
                    ariaLabelledBy: 'modal-title',
                    ariaDescribedBy: 'modal-body',
                    templateUrl: 'downloadRecords.html',
                    controllerAs: '$ctrl',
                    controller: function ($scope) {
                        $scope.Math = window.Math;
                        $scope.cameraRef = cameraRef;
                        $scope.close = function () {
                            modalInstance.dismiss('cancel');
                        };
                    }
                });
            };

            $scope.onDrop = function ($event, $dragData) {
                var rect = $event.currentTarget.getBoundingClientRect();
                var startTs = $scope.interval.startDate.getTime();
                var endTs = $scope.interval.endDate.getTime();
                var newDate = startTs + Math.floor((endTs - startTs) * ($event.clientX - rect.left) / rect.width);

                if ($dragData === 'left') {
                    $scope.interval.startDate = new Date(newDate);
                } else {
                    $scope.interval.endDate = new Date(newDate);
                }
            };

            $scope.setPlaybackRate = function (rate) {
                $scope.playbackRate = rate;
            };

            $scope.seek = function (relativeMs) {
                var absoluteMs = $scope.interval.startDate.getTime() + relativeMs;
                var earliestTs = null;
                var atLeastOneFound = false;
                for (var i = 0; i < $scope.selectedCameras.length; i++) {
                    var cameraRef = $scope.selectedCameras[i];
                    if (cameraRef.currentRecord && absoluteMs >= cameraRef.currentRecord.startTs && absoluteMs < cameraRef.currentRecord.endTs) {
                        atLeastOneFound = true;
                        earliestTs = absoluteMs;
                        cameraRef.video.currentTime = Math.floor((absoluteMs - cameraRef.currentRecord.startTs) / 10) / 100;
                        try {
                            if ($scope.playbackRate > 0)
                                cameraRef.video.play();
                        } catch (e) {
                            console.log(e);
                        }
                    } else {
                        cameraRef.videoLoaded = false;
                        var found = false;
                        for (var j = 0; j < cameraRef.records.length; j++) {
                            // looking for ealiest available records, in case no records are found
                            if (cameraRef.records[j].startTs > absoluteMs && (earliestTs === null || earliestTs > cameraRef.records[j].startTs)) {
                                earliestTs = cameraRef.records[j].startTs;
                            }
                            //console.log('seeking ', new Date(absoluteMs), ' among ', new Date(cameraRef.records[j].startTs), ' and ', new Date(cameraRef.records[j].endTs));
                            if (absoluteMs >= cameraRef.records[j].startTs && absoluteMs < cameraRef.records[j].endTs) {
                                cameraRef.currentRecord = cameraRef.records[j];
                                console.log('found at position ', j);
                                atLeastOneFound = found = true;
                                break;
                            }
                        }
                        if (found) {
                            cameraRef.video.src = cameraRef.currentRecord.src;
                            cameraRef.video.currentTime = Math.floor((absoluteMs - cameraRef.currentRecord.startTs) / 10) / 100;
                        } else {
                            cameraRef.currentRecord = null;
                        }
                    }
                }
                var percent = $scope.calculateCurrentPlaybackPercent();
                if (percent) {
                    $scope.currentPlayerTimePercent = percent;
                } else {
                    $scope.currentPlayerTimePercent = 100 * relativeMs / $scope.timeInterval;
                    $scope.currentPlaybackTime = $filter('date')(new Date(absoluteMs), 'HH:mm:ss');
                }

                if (!atLeastOneFound && earliestTs !== null) {
                    $scope.seek(earliestTs - $scope.interval.startDate.getTime());
                }
            };

            $scope.addCamera();
        })
    .directive('ngEventVideo',
        function () {
            return {
                'restrict': 'A',
                'scope': {
                    ngEventVideo: '=',
                    ngEventOpened: '=',
                    playbackRate: '='
                },
                'controller': function ($scope) {

                },
                'link': function ($scope, element) {
                    var iniContainer = function () {
                        var video = angular.element('<video muted="muted" controls preload="metadata"></video>').appendTo(element);
                        $scope.$parent.initVideo(video, $scope.ngEventVideo, $scope.ngEventOpened);
                    };
                    $scope.$watch('ngEventVideo', function (newV, oldV) {
                        if (newV === oldV)
                            return;
                        if (oldV.eventVideo) {
                            angular.element(oldV.eventVideo).empty().remove();
                        }
                        iniContainer();
                    });
                    $scope.$watch('ngEventOpened', function (newV, oldV) {
                        if (newV === oldV)
                            return;
                        if ($scope.ngEventVideo.eventVideo) {
                            angular.element($scope.ngEventVideo.eventVideo).empty().remove();
                        }
                        iniContainer();
                    });

                    $scope.$watch('playbackRate', function (newV, oldV) {
                        if (newV === oldV)
                            return;
                        if ($scope.playbackRate > 0) {
                            element[0].playbackRate = $scope.playbackRate;
                            if (element[0].paused) {
                                try {
                                    element[0].play();
                                } catch (e) {
                                    console.log(e);
                                }
                            }
                        } else {
                            element[0].pause();
                        }

                    });

                    iniContainer();
                }
            };
        })
    .directive('ngArchiveVideo',
        function () {
            return {
                'restrict': 'A',
                'scope': {
                    ngArchiveVideo: '=',
                    playbackRate: '='
                },
                'controller': function ($scope) {
                },
                'link': function ($scope, element) {
                    $scope.ngArchiveVideo.video = element[0];
                    $scope.ngArchiveVideo.videoLoaded = false;
                    element[0].onloadedmetadata = function () {
                        $scope.ngArchiveVideo.videoLoaded = true;
                        element[0].playbackRate = $scope.playbackRate;
                        try {
                            if ($scope.playbackRate > 0)
                                element[0].play();
                            else
                                element[0].pause();
                        } catch (e) {
                            console.log(e);
                        }
                    };

                    $scope.$watch('ngArchiveVideo', function (newV, oldV) {
                        if (newV === oldV)
                            return;
                        $scope.ngArchiveVideo.videoLoaded = false;
                        $scope.ngArchiveVideo.video = element[0];
                        try {
                            if ($scope.playbackRate > 0)
                                element[0].play();
                            else
                                element[0].pause();
                        } catch (e) {
                            console.log(e);
                        }
                    });

                    $scope.$watch('playbackRate', function (newV, oldV) {
                        if (newV === oldV)
                            return;
                        if ($scope.playbackRate > 0) {
                            element[0].playbackRate = $scope.playbackRate;
                            if (element[0].paused) {
                                try {
                                    element[0].play();
                                } catch (e) {
                                    console.log(e);
                                }
                            }
                        } else {
                            element[0].pause();
                        }

                    });
                }
            };
        });

