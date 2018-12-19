var module = angular.module('Services');
module.service('CamerasService', function(RequestService, API) {
    return {
        getList: function (organizationId) {
            var params = {
                url: API.CAMERAS.PATH,
                params: {
                    params: {
                        organization: organizationId || undefined
                    }
                }
            };
            return RequestService.get(params);
        },
        updateCamera: function(data) {
            var params = {
                url: API.CAMERAS.PATH + data.id + '/',
                data: data,
                method: 'PUT'
            };
            return RequestService.post(params);
        },
        createCamera: function(data) {
            var params = {
                url: API.CAMERAS.PATH,
                data: data
            };
            return RequestService.post(params);
        },
        getCamera: function(cameraId) {
            var params = {
                url: API.CAMERAS.PATH + cameraId + '/'
            };
            return RequestService.get(params);
        },
        deleteCamera: function(cameraId) {
            var params = {
                url: API.CAMERAS.PATH + cameraId + '/',
                method: 'DELETE'
            };
            return RequestService.post(params);
        },
        getUserCamerasList: function() {
            var params = {
                path: API.USER_CAMERAS.PATH
            };
            return RequestService.get(params);
        }
    }
});
