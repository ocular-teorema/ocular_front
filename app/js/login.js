'use strict';
angular.module('Services', []);
angular.module('Constants', []);

var module = angular.module('app', ['Constants', 'Services']);
module.controller('loginController', function($scope, UsersService) {
    $scope.user = {};
    $scope.authError = false;
    $scope.sentLoginForm = function(authForm) {
        $scope.authError = false;
        if (authForm.$invalid) return;
        UsersService.authUser($scope.user).then(function(response) {
            window.location.href = '/';
        }, function(response) {
            switch (response.status) {
                case 400:
                    var errors = [];
                    for (var i in response.data) {
                        errors.push(response.data[i]);
                    }
                    $scope.authError = errors.join('; ');
                    $scope.$apply();
                    break;
                default:
                    $scope.authError = 'Error #' + response.status;
                    $scope.$apply();
                    break;
            }
        });
    };
}).config(function($locationProvider, $httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    })
}).run(function(UsersService) {
    UsersService.getCurrent().then(function(response) {
        switch (response.status) {
            case 200:
                window.location.href = '/';
                break;
        }
    }, function() {

    });
});
