var module = angular.module('app');
module.controller('organizationsController', function($scope, Windows, OrganizationsService, organizationsList) {

  $scope.organizationsList = organizationsList.data;
    
    $scope.tableTitles = [
      {
      name: 'Название',
      key: 'name'
    }
  ]

  $scope.sortOrganizations = function (key) {
    $scope.organizationsList = _.sortBy($scope.organizationsList, [function (o) {return o[key]}])  
    $scope.sortField = key;
  }

  $scope.sortOrganizations('name');

  $scope.deleteOrganization = function(organization) {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function() {
        OrganizationsService.deleteOrganization(organization.id).then(function() {
          $scope.organizationsList = $scope.organizationsList.filter(function(org) {
            return org !== organization;
          });
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление организацию из базы',
      text: 'Вы действительно хотите удалить организацию "' + organization.name + '"?'
    });
  };

});
