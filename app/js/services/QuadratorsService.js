var module = angular.module('Services');
module.service('QuadratorsService', function(RequestService, API) {
    return {
        getList: function (organizationId) {
            var params = {
                url: API.QUADRATORS.PATH,
                params: {
                    params: {
                        organization: organizationId || undefined
                    }
                }
            };
            return RequestService.get(params);
        },
        updateQuadrator: function(data) {
            var params = {
                url: API.QUADRATORS.PATH + data.id + '/',
                data: data,
                method: 'PUT'
            };
            return RequestService.post(params);
        },
        createQuadrator: function(data) {
            var params = {
                url: API.QUADRATORS.PATH,
                data: data
            };
            return RequestService.post(params);
        },
        getQuadrator: function(quadratorId) {
            var params = {
                url: API.QUADRATORS.PATH + quadratorId + '/'
            };
            return RequestService.get(params);
        },
        deleteQuadrator: function(quadratorId) {
            var params = {
                url: API.QUADRATORS.PATH + quadratorId + '/',
                method: 'DELETE'
            };
            return RequestService.post(params);
        }
    }
});
