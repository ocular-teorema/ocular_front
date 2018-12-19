angular
    .module('Services')
    .service('MonitoringService', function($http, API, $timeout, $q) {
        return {
            longPoolMonitoring: function (camera) {
                var deffered = $q.defer();
                camera.defer = deffered;

                $http.get(camera.events_url + 'stream_events?ts=' + (camera.lastTimeStamp || 0), {
                    timeout: deffered.promise
                }).then(function (result) {
                    deffered.resolve(result.data);
                }, function(response) {
                    deffered.reject();
                });
                // camera.longPoolTimer = $timeout(function () {
                //         deffered.resolve();
                //     }, 30000);
                return deffered.promise;
            },
            getEventInfo: function (eventType) {
                var ALERT_TYPE_AREA = 0x1; // Motion inside inactive area
                var ALERT_TYPE_TOO_MANY_OBJECTS = 0x2; // # Too many objects
                var ALERT_TYPE_INVALID_MOTION = 0x4; // # Motion in wrong direction
                var ALERT_TYPE_VELOCITY = 0x8; // # Too fast or too slow motion
                var ALERT_TYPE_STATIC_OBJECT = 0x10; // # Left object
                var ALERT_TYPE_PEOPLE_COUNT = 0x20;

                var descriptions = {};
                descriptions[ALERT_TYPE_AREA] = {
                    description: "Движение в зоне",
                    short_description: 'Движение',
                    type: "motion"
                };
                descriptions[ALERT_TYPE_TOO_MANY_OBJECTS] = {
                    description: "Ошибка калибровки",
                    short_description: 'Калибровка',
                    type: "calibration_error"
                };
                descriptions[ALERT_TYPE_INVALID_MOTION] = {
                    description: "Вектор движения",
                    short_description: 'Вектор',
                    type: "wrong_direction"
                };
                descriptions[ALERT_TYPE_VELOCITY] = {
                    description: "Скорость движения",
                    short_description: 'Скорость',
                    type: "velocity"
                };
                descriptions[ALERT_TYPE_STATIC_OBJECT] = {
                    description: "Оставленный предмет",
                    short_description: 'Оставл. предмет',
                    type: "leave_object"
                };
                descriptions[ALERT_TYPE_PEOPLE_COUNT] = {
                    description: "Превышение количества людей",
                    short_description: 'Превышение кол-ва людей',
                    type: "leave_object"
                };
                return descriptions[eventType];
            },
            securityReaction: function (id, reaction, camera) {

                var parser = document.createElement('a');
                parser.href = camera.events_url;

                var url = 'http://' + parser.host;
                var deffered = $q.defer();
                $http.get(url + API.SECURITY_PATH + '?name=securityReaction&id=' + id + '&reaction=' + reaction)
                    .then(function (result) {
                            deffered.resolve(result);
                        }, function (error) {
                            deffered.reject(error);
                        }
                    );
                return deffered.promise;
            }
        }
    });

// 7. Иконки на камере (движение, запись, полный анализ) не соответствуют настройкам в админке
// 8. Добавить новое событие "Толпа" (Гена добавил в статистику подсчет людей). нужно добавить его в фильтр событий во вкладку "Запись"