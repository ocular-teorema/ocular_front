var module = angular.module('app');
module.controller('serversEditController', function($scope, $state, Windows, organizationsList, server, serversList,  ServersService) {
  
  $scope.organizationsList = organizationsList.data;

  $scope.serversAnalysisList = _.filter(serversList.data, function (server) {
    return server.type === 'full' || 'analysis';
  });
  
  
  if (server) {
    $scope.serverModel = server.data;
    if (!$scope.serverModel.type) $scope.serverModel.type = 'storage';
  } else {
    $scope.serverModel = {
      type: 'storage'
    }
  }

  $scope.saveServer = function(serverForm) {
    
    if (!serverForm.$valid) {
      return;
    }
    var requestData = angular.copy($scope.serverModel);
    if (requestData.type === 'full') requestData.parent_server_id = 0;
    ServersService[requestData.id ? 'updateServer' : 'createServer'](
      requestData
    ).then(function(response) {
      if (!requestData.id) {
        $state.go('main.adminsettings.servers.list');
      } else {
        $scope.serverModel = response.data;
        Windows.alert({
          title: 'Обновление параметров сервера',
          text: 'Сервер успешно обновлен'
        });
      }
    });
  };

  $scope.deleteServer = function() {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function() {
        ServersService.deleteServer($scope.serverModel.id).then(function(
          response
        ) {
          $state.go('main.adminsettings.servers.list');
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление камеры из базы',
      text:
        'Вы действительно хотите удалить сервер ' +
        $scope.serverModel.name +
        '?'
    });
  };

});
