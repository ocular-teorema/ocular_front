var module = angular.module('app');
module.controller('usersController', function($scope, $rootScope, UsersService, usersList, Windows, selectedOrganization) {
  $scope.users = angular.copy(usersList.data);
  $scope.organizationId = selectedOrganization;
  $scope.tableTitles = [
    {
      key: "username",
      name: 'логин'
    },
    {
      key: "fio",
      name: 'фио'
    },
    {
      key: "email",
      name: 'эл. почта'
    },
    {
      key: "phone",
      name: 'телефон'
    },
  ]

  $scope.sortUsers = function (key) {
    $scope.users = _.sortBy($scope.users, [function (o) {return o[key]}])  
    $scope.sortField = key;
  }

  $scope.deleteUser = function(user) {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function() {
        UsersService.deleteUser(user.id).then(function() {
          $scope.users = $scope.users.filter(function(us) {
            return us !== user;
          });
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление пользователя из базы',
      text: 'Вы действительно хотите удалить пользователя "' + user.fio + '"?'
    });
  };
});
