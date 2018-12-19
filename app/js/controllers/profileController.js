var module = angular.module('app');
module.controller('profileController', function($scope, $state, $rootScope, Windows, Timezones, UsersService) {
  $scope.user = angular.copy($rootScope.currentUser);

  $scope.timezones = Timezones;

  $scope.saveUser = function(profileForm) {
    if (!profileForm.$valid) return;

    var request = angular.copy($scope.user); 

    UsersService.saveUser(request).then(function(response) {
      if (!request.id) {
        var user = response.data;
        $state.go('main.administration.profile');
      } else {
        $state.go('login');
      }
    });
  };
});
