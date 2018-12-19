var module = angular.module('Services');
module.service('OrganizationsService', function(RequestService, API) {
    return {
        getList: function (organizationId) {
            var path = (organizationId) ? API.ORGANIZATIONS.PATH + organizationId + '/' : API.ORGANIZATIONS.PATH ;
            var params = {
                url: path
            };
            return RequestService.get(params);
        },
        editOrganization: function(data) {
            var params = {
                url: API.ORGANIZATIONS.PATH + data.id + '/',
                data: data,
                method: 'PUT'
            };
            return RequestService.post(params);
        },
        createOrganization: function(data) {
            var params = {
                url: API.ORGANIZATIONS.PATH,
                data: data
            };
            return RequestService.post(params);
        },
        deleteOrganization: function(organizationId) {
            var params = {
                url: API.ORGANIZATIONS.PATH + organizationId + '/',
                method: 'DELETE'
            };
            return RequestService.post(params);
        }
    }
});
