var module = angular.module('Services');
module.service('UsersService', function(RequestService, API) {
    return {
        getList: function (organizationId) {
            var params = {
                url: API.USERS.PATH,
                params: {
                    params: {
                        organization: organizationId || undefined
                    }
                }
            };
            return RequestService.get(params);
        },
        getCurrent: function () {
            var params = {
                path: API.ACCOUNTS.PATH,
                url: API.ACCOUNTS.PROFILE
            };
            return RequestService.get(params);
        },
        getUser: function (id) {
            var params = {
                url: API.USERS.PATH + id + '/'
            };
            return RequestService.get(params);
        },
        saveUser: function(data) {
            var params = {
                data: data,
                url: API.USERS.PATH + (data.id ? data.id + '/' : ''),
                method: data.id ? 'PUT' : false
            };
            return RequestService.post(params);
        },
        deleteUser: function(userId) {
            var params = {
                url: API.USERS.PATH + userId + '/',
                method: 'DELETE'
            };
            return RequestService.post(params);
        },




        authUser: function(data) {
            var params = {
                data: data,
                url: API.AUTH.PATH + API.AUTH.LOGIN
            };
            return RequestService.post(params);
        },
        logOut: function() {
            var params = {
                url: API.AUTH.PATH + API.AUTH.LOGOUT
            };
            return RequestService.post(params);
        }
    }
});
