var module = angular.module('app');
module.controller('camerasController', function ($scope, Windows, CamerasService, selectedOrganization, camerasList) {
  $scope.cameras = angular.copy(camerasList.data);
  $scope.organizationId = selectedOrganization;

  $scope.tableTitles = [
    {
      key: "group",
      name: 'группа камер'
    },
    {
      key: "name",
      name: 'имя камеры'
    },
    {
      key: "storage_life",
      name: 'срок хранения (дней)'
    },
    {
      key: "analysis",
      name: 'анализ'
    },
    // {
    //   key: "price",
    //   name: 'стоимость в месяц'
    // },
    // {
    //   key: "date",
    //   name: 'оплачена по'
    // }
  ]

  $scope.analiseTypesList = {
    1: 'Только запись',
    2: 'Только движение',
    3: 'Полный анализ'
  };

  $scope.sortCameras = function (key) {
    if (key === 'group') {
      $scope.cameras = _.sortBy($scope.cameras, [function (o) { return o.camera_group.name }])
    } else {
      $scope.cameras = _.sortBy($scope.cameras, [function (o) { return o[key] }])
    }
    $scope.sortField = key;
  }

  $scope.sortCameras('group')

  $scope.deleteCamera = function (camera) {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function () {
        CamerasService.deleteCamera(camera.id).then(function () {
          $scope.cameras = $scope.cameras.filter(function (cam) {
            return cam !== camera;
          });
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление камеру из базы',
      text: 'Вы действительно хотите удалить камеру "' + camera.name + '"?'
    });
  };
})