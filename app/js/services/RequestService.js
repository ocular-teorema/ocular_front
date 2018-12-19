var module = angular.module('Services');
module.service('RequestService', function($http, API) {
    return {
        /**
         *
         * @param params
         * @param successCallback
         * @param errorCallback
         */
        get: function(params) {
            var url = params.path || API.PATH;
            url+= params.url || '';
            return $http.get(url, params.params);
        },
        /**
         *
         * @param params
         */
        post: function(params) {
            var url = API.PATH;
            url+= params.url || '';
            var requestOptions = {
                method: params.method || 'POST',
                url: url,
                data: params.data
            };
            return $http(requestOptions);
        }
    } ;
});
