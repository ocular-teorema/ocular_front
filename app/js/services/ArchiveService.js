
angular
    .module('Services')
    .service('ArchiveService', function ($q, $http, EventsDescription) {
        return {
            getStatistics: function (serverAddress, startTimestamp, endTimestamp, cameraIds) {
                return $http.get('http://' + serverAddress + ':5005/stat?startTs=' + startTimestamp + '&endTs=' + endTimestamp + '&cameras=' + cameraIds.join(','));
            },
            getEvents: function (serverAddress, startTimestamp, endTimestamp, cameraIds, filters, skip) {
                var react = [];
                if (filters.noreact)
                    react.push(-1);
                if (filters.react) {
                    react.push(1);
                    react.push(2);
                }
                var types = [];
                if (filters.motion)
                    types.push(EventsDescription.ALERT_TYPE_AREA);
                if (filters.velocity)
                    types.push(EventsDescription.ALERT_TYPE_VELOCITY);
                if (filters.wrong_direction)
                    types.push(EventsDescription.ALERT_TYPE_INVALID_MOTION);
                if (filters.calibration_error)
                    types.push(EventsDescription.ALERT_TYPE_CALIBRATION_ERROR);

                return $http.get('http://' + serverAddress + ':5005/archive?startTs=' + startTimestamp + '&endTs=' + endTimestamp + '&cameras=' + cameraIds.join(',') + '&react=' + react.join(',') + '&types=' + types.join(',') + '&conf_low=' + (filters.confidence.low ? 1 : 0) + '&conf_medium=' + (filters.confidence.medium ? 1 : 0) + '&conf_high=' + (filters.confidence.high ? 1 : 0) + '&skip=' + skip + '&limit=10000');
            },
            getArchiveVideos: function (serverAddress, startTimestamp, endTimestamp, cameraIds, skip) {
                return $http.get('http://' + serverAddress + ':5005/archive_video?startTs=' + startTimestamp + '&endTs=' + endTimestamp + '&cameras=' + cameraIds.join(',') + '&skip=' + skip + '&limit=10000');
            }
        };
    });