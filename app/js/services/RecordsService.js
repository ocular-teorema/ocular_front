
angular
    .module('Services')
    .service('RecordsService', function($q, $http, ServersService) {
        return {
            getStatistics: function(startDate, endDate, startTime, endTime, camera) {
                return ServersService.getServer(camera.server).then(function(res) {
                    var deffered = $q.defer();
                    $http.get('http://' + res.data.fact_address + ':5005/db/startDate='+startDate+'&endDate='+endDate+'&startTime='+startTime+'&endTime='+endTime +'&events=0&cam=cam'+camera.id)
                        .then(function(result) {
                            deffered.resolve({
                                data: result.data,
                                server: res.data
                            });
                        }, function(error) {
                            deffered.reject(error);
                        });
                    return deffered.promise;
                })
            },
            getEvents: function(startDate, endDate, startTime, endTime, camera) {
                return ServersService.getServer(camera.server).then(function(res) {
                var deffered = $q.defer();
                $http.get('http://' + res.data.fact_address + ':5005/archivedb/startDate='+startDate+'&endDate='+endDate+'&startTime='+startTime+'&endTime='+endTime+'&cam=cam'+camera.id)
                    .then(function(result) {
                        deffered.resolve(result.data);
                    }, function(error) {
                        deffered.reject(error);
                    });
                return deffered.promise;
            })
        }}
    });