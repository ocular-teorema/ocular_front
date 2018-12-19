var module = angular.module('Services');
module.service('CollectionsService', function(RequestService, API) {

    return {
        getList: function () {
            var params = {
                url: API.CAMSETS.PATH
            };
            return RequestService.get(params);
        },
        createCollection: function (data) {
            var params = {
                data: data,
                url: API.CAMSETS.PATH + (data.id ? data.id + '/' : ''),
                method: data.id ? 'PUT' : false
            };
            return RequestService.post(params);
        },
        deleteCollection: function(id) {
            var params = {
                url: API.CAMSETS.PATH + id + '/',
                method: 'DELETE'
            };
            return RequestService.post(params);
        }
    }
});
