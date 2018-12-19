var module = angular.module('Services');
module.service('ServersService', function(RequestService, API) {
    return {
        getList: function (organizationId) {
            var params = {
                url: API.SERVERS.PATH,
                params: {
                    params: {
                        organization: organizationId || undefined
                    }
                }
            };
            return RequestService.get(params);
        },
        updateServer: function(data) {
            var params = {
                url: API.SERVERS.PATH + data.id + '/',
                data: data,
                method: 'PUT'
            };
            return RequestService.post(params);
        },
        createServer: function(data) {
            var params = {
                url: API.SERVERS.PATH,
                data: data
            };
            return RequestService.post(params);
        },
        getServer: function(serverId) {
            var params = {
                url: API.SERVERS.PATH + serverId + '/'
            };
            return RequestService.get(params);
        },
        deleteServer: function(serverId) {
            var params = {
                url: API.SERVERS.PATH + serverId + '/',
                method: 'DELETE'
            };
            return RequestService.post(params);
        }
    }
});