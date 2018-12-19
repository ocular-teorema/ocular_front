var module = angular.module('app');
module.controller('serversController', function($scope, Windows, ServersService, serversList) {
  
  $scope.serversList = serversList.data;

  $scope.tableTitles = [
    {
      name: 'Название',
      key: 'name'
    },
    {
      name: 'Тип',
      key: 'type'
    },
    {
      name: 'ip-адрес',
      key: 'address'
    },
  ],

  $scope.serverTypes = {
    storage: 'Хранение',
    analysis: 'Анализ',
    full: 'Анализ и хранение'
  }



  $scope.sortServers = function (key) {
    $scope.serversList = _.sortBy($scope.serversList, [function (o) {return o[key]}])  
    $scope.sortField = key;
  }

  $scope.sortServers('name');

  $scope.deleteServer = function(server) {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function() {
        ServersService.deleteServer(server.id).then(function() {
          $scope.serversList = $scope.serversList.filter(function(serv) {
            return serv !== server;
          });
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление сервера из базы',
      text: 'Вы действительно хотите удалить сервер "' + server.name + '"?'
    });
  };

});
