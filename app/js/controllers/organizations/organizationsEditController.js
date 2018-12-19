var module = angular.module('app');
module.controller('organizationsEditController', function($scope, $state, UsersService, Windows, organization, serversList, ServersService, OrganizationsService) {

  $scope.initialServersList = angular.copy(serversList.data);
  $scope.serversList = angular.copy(serversList.data);
  $scope.selectedServers = [];
  $scope.serversList.unshift({
    name: 'Выберите сервер'
  })

  
  if (organization) {
    $scope.organizationModel = organization.data;
  } else {
    $scope.organizationModel = {}
  }

  $scope.saveOrganization = function(organizationForm) {
    if (!organizationForm.$valid) {
      return;
    }
    var requestData = angular.copy($scope.organizationModel);
    OrganizationsService[requestData.id ? 'editOrganization' : 'createOrganization'](
      requestData
    ).then(function(response) {
      if (!requestData.id) {
        $state.go('main.adminsettings.organizations.list');
      } else {
        $scope.organizationModel = response.data;
        Windows.alert({
          title: 'Обновление параметров организации',
          text: 'Организация успешно обновлена'
        });
      }
    });
  };

  $scope.deleteOrganization = function() {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function() {
        OrganizationsService.deleteOrganization($scope.organizationModel.id).then(function(
          response
        ) {
          $state.go('main.adminsettings.organizations.list');
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление организации из базы',
      text:
        'Вы действительно хотите удалить организацию ' +
        $scope.organizationModel.name +
        '?'
    });
  };

});
