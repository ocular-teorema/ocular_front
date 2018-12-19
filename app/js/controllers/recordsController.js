
angular
    .module('app')
    .controller('recordsController',
        function($scope, RecordsService, $filter, $rootScope, EventsDescription, $timeout, userCameras) {

            $scope.recordsMode = 'archive';

            $scope.toggleMode = function (mode) {
              $scope.recordsMode = mode;
              $scope.applyFilters();

              if ($scope.recordsMode === 'journal') {
                getEvents();                
              }            
            };

            var getEvents = function() {
              var startTime = new Date($filter('date')(angular.element.datepicker.parseDate("dd.mm.yy D", $scope.startDate), 'yyyy-MM-d'));
              startTime.setHours($scope.startTime.slice(0,2), $scope.startTime.slice(3,5))
              var endTime = new Date($filter('date')(angular.element.datepicker.parseDate("dd.mm.yy D", $scope.endDate), 'yyyy-MM-d'));
              endTime.setHours($scope.endTime.slice(0,2), $scope.endTime.slice(3,5))

              RecordsService.getEvents(
                  $filter('date')(angular.element.datepicker.parseDate("dd.mm.yy D", $scope.startDate), 'yyyy-MM-d'),
                  $filter('date')(angular.element.datepicker.parseDate("dd.mm.yy D", $scope.endDate), 'yyyy-MM-d'),
                  startTime.getTime(),
                  endTime.getTime(),
                  $scope.cameraModel,
              ).then(
                parseEvents,
                function() {
                  $scope.selectedCamera = $scope.cameraModel;
                  $scope.sendForm = false;
                }
              );
            };

            var parseEvents = function (data) {
              $scope.journalEvents = [];
              $scope.journalEvents = data.reverse();
              for (let i = 0; i < $scope.journalEvents.length; i++) {
                const event = $scope.journalEvents[i];
                event.isVisible = 
                ($scope.selectedCamera.analysis == 1) ||
                ((($scope.filters.false && event.reaction == 2) ||
                ($scope.filters.noreact && event.reaction == -1) ||
                ($scope.filters.alerts && event.reaction == 1)) &&
                ($scope.filters.confidence <= event.confidence) &&
                (($scope.filters.motion && event.eventType === EventsDescription.ALERT_TYPE_AREA) ||
                ($scope.filters.leave_object && event.eventType === EventsDescription.ALERT_TYPE_STATIC_OBJECT) ||
                ($scope.filters.velocity && event.eventType === EventsDescription.ALERT_TYPE_VELOCITY) ||
                ($scope.filters.many_people && event.eventType === EventsDescription.ALERT_TYPE_PEOPLE_COUNT) ||
                ($scope.filters.wrong_direction && event.eventType === EventsDescription.ALERT_TYPE_INVALID_MOTION) ||
                ($scope.filters.calibration_error && event.eventType === EventsDescription.ALERT_TYPE_CALIBRATION_ERROR)));
              }
            };

            /* Список всех доступных камер */

            $scope.userCameras = angular.copy($rootScope.userCameras);
            var camerasList = [];

            $scope.userCameras.groups.map(function(group) {
                var cameras = group.cameras;
                cameras.map(function(cam) {
                    var parser = document.createElement('a');
                    parser.href = cam.events_url;
                    cam.archive_url = parser.protocol + '//' + parser.hostname + ':8080';


                    cam.thumb_url_record = parser.protocol + '//' + parser.hostname + ':8080/cam' + cam['id'] + '/thumb.jpg';
                    cam.thumb_url = parser.protocol +'//' + parser.hostname + ':5005/thumb/' + cam['id'] + '/';

                    cam.info_url = cam.analysis === 1 ? '' :'http://' + parser.host;
                    // iframe.attr('src', '/video.html?video=' + encodeURIComponent('http://' + parser.hostname +':8080/cam' + camera['id'] + '/alertFragments/alert' + event.id + '.mp4'));
                    camerasList.push(cam);
                });
            });

            // $scope.archivePort = ServerConfiguration.ARCHIVE_PORT;

            var nowDate = new Date();
            var twoWeeksAgo = (new Date(nowDate.getTime() - 24 * 60 * 60 * 1000));

            var statParams = (window.localStorage && window.localStorage['statParams']) ? JSON.parse(window.localStorage['statParams']) : {};
            var allFilters = (window.localStorage && window.localStorage['statFilters']) ? JSON.parse(window.localStorage['statFilters']) : {};


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

            var defaultSecurityFilters = {
                "noevents": true,
                "false": true,
                "noreact": true,
                "alerts": true,
                "motion": true,
                "leave_object": true,
                "velocity": true,
                "wrong_direction": true,
                "calibration_error": true,
                "confidence": $scope.displayingList[0].value
            };


            if (!$rootScope.currentUser.is_organization_admin) {
                for (var i in defaultSecurityFilters) {
                    allFilters[i] = defaultSecurityFilters[i];
                }
            }

            $scope.startDate = statParams['startDate'] || angular.element.datepicker.formatDate("dd.mm.yy D", nowDate);
            $scope.startDateOptions = {
                maxDate: nowDate
            };

            $scope.endDate = statParams['endDate'] || angular.element.datepicker.formatDate("dd.mm.yy D", nowDate);
            $scope.endDateOptions = {
                maxDate: nowDate
            };

            /*** Update of filters ***/
            $scope.$watch('startDate', function(n) {
                if (n) {
                    $timeout(function() {
                        var date = $scope.startDateOptions.noFormattedDate;
                        if (date > $scope.endDateOptions.noFormattedDate) {
                            $scope.endDate = angular.element.datepicker.formatDate("dd.mm.yy D", date);
                        }
                        $scope.getStatistic();
                        if ($scope.recordsMode === 'journal') {
                          getEvents();
                        }
                    })
                }
            });
            $scope.$watch('endDate', function(n) {
                if (n) {
                    $timeout(function() {
                        var date = $scope.endDateOptions.noFormattedDate;
                        if (date < $scope.startDateOptions.noFormattedDate) {
                            $scope.startDate = angular.element.datepicker.formatDate("dd.mm.yy D", date);
                        }
                        $scope.getStatistic();
                        if ($scope.recordsMode === 'journal') {
                          getEvents();
                        }
                    });
                }
            });

            $scope.setSettings = function () {
              $scope.getStatistic();
              if ($scope.recordsMode === 'journal') {
                getEvents();
              }
            };

            $scope.camerasGroups = angular.copy($rootScope.camerasGroups);

            $scope.timesList = [];

            var timeRange = 30;
            for (var t = 0; t < 1440; t += timeRange) {
                var h = Math.floor(t / 60);
                var m = t % 60;
                h = (h < 10 ? '0' : '') + h;
                m = (m < 10 ? '0' : '') + m;
                $scope.timesList.push(h + ':' + m);
            }

            $scope.timesList.push('23:59');

            $scope.startTime = statParams['startTime'] || '00:00';
            $scope.endTime = statParams['endTime'] || '23:59';

            var storageCamera = statParams['camera'] || false;

            $scope.cameraModel = storageCamera ? camerasList.filter(function(cam) {
                return cam.id == storageCamera
            })[0] : camerasList[0];

            $scope.filters = {
                "noevents": allFilters.noevents !== undefined ? allFilters.noevents : true,
                "false": allFilters.false !== undefined ? allFilters.false : true,
                "noreact": allFilters.noreact !== undefined ? allFilters.noreact : true,
                "alerts": allFilters.alerts !== undefined ? allFilters.alerts : true,
                "motion": allFilters.motion !== undefined ? allFilters.motion : true,
                "leave_object": allFilters.leave_object !== undefined ? allFilters.leave_object : true,
                "many_people": allFilters.many_people !== undefined ? allFilters.many_people : true,
                "velocity": allFilters.velocity !== undefined ? allFilters.velocity : true,
                "wrong_direction": allFilters.wrong_direction !== undefined ? allFilters.wrong_direction : true,
                "calibration_error": allFilters.calibration_error !== undefined ? allFilters.calibration_error : true
            };

            $scope.$watch('confidence', function() {
                if ($scope.confidence === undefined) return;
                $scope.applyFilters();
            });

            $scope.confidence = $scope.displayingList[0]['value'];

            var julianIntToDate = function(JD) {
              var y = 4716;
              var v = 3;
              var j = 1401;
              var u =  5;
              var m =  2;
              var s =  153;
              var n = 12;
              var w =  2;
              var r =  4;
              var B =  274277;
              var p =  1461;
              var C =  -38;
              var f = JD + j + Math.floor((Math.floor((4 * JD + B) / 146097) * 3) / 4) + C;
              var e = r * f + v;
              var g = Math.floor((e % p) / r);
              var h = u * g + w;
              var D = Math.floor((h % s) / u) + 1;
              var M = ((Math.floor(h / s) + m) % n) + 1;
              var Y = Math.floor(e / p) - y + Math.floor((n + m - M) / n) ;
              return Date.parse(new Date(Y,M-1,D));
            };

            var parseStatistics = function(response) {

                var data = response.data;
                $scope.currentServer = response.server;

                $scope.eventsList = [];
                $scope.selectedCamera = $scope.cameraModel;
                data.map(function(eventItem) {

                    var decadeDate = angular.element.datepicker.parseDate('@', julianIntToDate(eventItem.date));

                    var decadeTime = eventItem.start.split('-');
                    decadeDate.setHours(decadeTime[0], decadeTime[1]);
                    eventItem.ts = decadeDate.getTime();

                    var date = (new Date(eventItem.ts));
                    date.setHours(0, 0, 0, 0);

                    var currentEvent;
                    if (!(currentEvent = $scope.eventsList.find(function(event) {
                            return date.getTime() == event.date;
                        }))) {
                        currentEvent = {
                            date: date.getTime(),
                            events: [eventItem]
                        };
                        $scope.eventsList.push(currentEvent);
                    } else {
                        currentEvent.events.push(eventItem);
                    }
                });

                $scope.applyFilters();
                $scope.sendForm = false;
            };

            var getStatisticTime;
            $scope.getStatistic = function() {
                if (!$scope.cameraModel) return;
                getStatisticTime ? $timeout.cancel(getStatisticTime) : false;

                getStatisticTime = $timeout(function() {
                    statParams['camera'] = $scope.cameraModel.id;
                    statParams['startTime'] = $scope.startTime;
                    statParams['endTime'] = $scope.endTime;
                    statParams['startDate'] = $scope.startDate;
                    statParams['endDate'] = $scope.endDate;

                    if (window.localStorage) {
                        window.localStorage['statParams'] = JSON.stringify(statParams);

                        $scope.sendForm = true;

                        RecordsService.getStatistics(
                            $filter('date')(angular.element.datepicker.parseDate("dd.mm.yy D", $scope.startDate), 'yyyy-MM-d'),
                            $filter('date')(angular.element.datepicker.parseDate("dd.mm.yy D", $scope.endDate), 'yyyy-MM-d'),
                            $scope.startTime.replace(':', '-'),
                            $scope.endTime.replace(':', '-'),
                            $scope.cameraModel
                        ).then(parseStatistics, function() {
                            $scope.selectedCamera = $scope.cameraModel;
                            $scope.sendForm = false;
                        });
                    }
                });
            };

            var scrollTestDiv = angular.element('<div>').css({overflow: 'scroll'});
            var noScrolled = angular.element('<div>').appendTo(scrollTestDiv);
            angular.element('body').append(scrollTestDiv);
            var scrollSize = scrollTestDiv.width() - noScrolled.width();
            scrollTestDiv.detach().remove();

            var datesList = angular.element('#datesList');
            var eventsList = angular.element('#eventsList');
            datesList.parent().css({
                marginBottom: scrollSize
            });
            var eventsListHandler = function(e) {
                if (!eventsListIsFocused) {
                    datesListIsFocused = true;
                    datesList.scrollTop(eventsList.scrollTop());
                } else {
                    eventsListIsFocused = false;
                }
            };
            var datesListHandler = function(e) {
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


            $scope.applyFilters = function() {
                $scope.filters.confidence = $scope.confidence;
                window.localStorage['statFilters'] = JSON.stringify($scope.filters);
                if (!$scope.eventsList) return;
                if (!$scope.selectedCamera) return;
                $scope.eventsList.map(function(day) {
                    day['noreacts'] = 0;
                    day['efalse'] = 0;
                    day['alerts'] = 0;

                    var confidenceEvents = $rootScope.currentUser.is_organization_admin ? day.events.filter(function(ev) {
                        ev.isVisible = false;
                        return ev.events.find(function(oneEvent) {
                                return (oneEvent.confidence >= $scope.confidence)
                            }) || ($scope.filters.noevents && !ev.events.length);
                    }) : day.events;   


                    confidenceEvents.map(function(ev) {
                        var startTime = ev.start.split('-');

                        // startTime[0] = (startTime[0] < 10 ? '0' : '') + startTime[0];
                        // startTime[1] = (startTime[1] < 10 ? '0' : '') + startTime[1];

                        // ev.parsedStart = startTime.join(':');

                      var confidenceEventsInDay = ev.events.filter(function(oneEvent) {
                          return oneEvent.confidence >= $scope.confidence
                        });
                        ev['noreacts'] = confidenceEventsInDay.filter(function(oneEvent) {
                            return oneEvent.reaction == '-1'
                        }).length;
                        ev['efalse'] = confidenceEventsInDay.filter(function(oneEvent) {
                            return oneEvent.reaction == '2'
                        }).length;
                        ev['alerts'] = confidenceEventsInDay.filter(function(oneEvent) {
                            return oneEvent.reaction == '1'
                        }).length;
                        ev['motion'] = !!confidenceEventsInDay.find(function(oneEvent) {
                            return oneEvent.eventType == EventsDescription.ALERT_TYPE_AREA
                        });
                        ev['leave_object'] = !!confidenceEventsInDay.find(function(oneEvent) {
                            return oneEvent.eventType == EventsDescription.ALERT_TYPE_STATIC_OBJECT
                        });
                        ev['velocity'] = !!confidenceEventsInDay.find(function(oneEvent) {
                            return oneEvent.eventType == EventsDescription.ALERT_TYPE_VELOCITY
                        });
                        ev['wrong_direction'] = !!confidenceEventsInDay.find(function(oneEvent) {
                            return oneEvent.eventType == EventsDescription.ALERT_TYPE_INVALID_MOTION
                        });
                        ev['many_people'] = !!confidenceEventsInDay.find(function(oneEvent) {
                            return oneEvent.eventType == EventsDescription.ALERT_TYPE_PEOPLE_COUNT
                        });
                        ev['calibration_error'] = !!confidenceEventsInDay.find(function(oneEvent) {
                            return oneEvent.eventType == EventsDescription.ALERT_TYPE_CALIBRATION_ERROR
                        });

                        ev.isVisible = ($scope.selectedCamera.analysis == 1) ||
                            ($scope.filters.noevents && !ev.events.length) ||
                            ((($scope.filters.false && ev.efalse) ||
                            ($scope.filters.noreact && ev.noreacts) ||
                            ($scope.filters.alerts && ev.alerts)) &&
                            (($scope.filters.motion && ev.motion) ||
                            ($scope.filters.leave_object && ev.leave_object) ||
                            ($scope.filters.velocity && ev.velocity) ||
                            ($scope.filters.many_people && ev.velocity.many_people) ||
                            ($scope.filters.wrong_direction && ev.wrong_direction) ||
                            ($scope.filters.calibration_error && ev.calibration_error)));
                        if (ev.isVisible) {
                            day['noreacts']+= ev['noreacts'];
                            day['efalse']+= ev['efalse'];
                            day['alerts']+= ev['alerts'];
                        }

                        ev.isVisible = ev.isVisible || !$rootScope.currentUser.is_organization_admin;
                    });
                  });
                };

            $scope.setCameraModel = function(camera) {
                $scope.cameraModel = camera;
                $scope.showedCategoriesList = false;
                $scope.activateGroup(activeGroup, true);
                $scope.getStatistic();
                if ($scope.recordsMode === 'journal') {
                  getEvents();
                }
            };
            var activeGroup = false;
            $scope.activateGroup = function(group, hide) {
                group.active = hide ? false : !group.active;
                if (activeGroup && (activeGroup != group)) {
                    activeGroup.active = false;
                }
                activeGroup = group;
            };
        }
    );

