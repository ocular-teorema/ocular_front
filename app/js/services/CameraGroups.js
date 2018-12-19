var module = angular.module('Services');
module.service('CameraGroupsService', function(RequestService, API) {
    return {
        getList: function (organizationId) {
            var params = {
                url: API.CAMERA_GROUPS.PATH,
                params: {
                    params: {
                        organization: organizationId || undefined
                    }
                }
            };
            return RequestService.get(params);
        }
    }
});