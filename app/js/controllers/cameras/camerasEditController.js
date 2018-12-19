var module = angular.module('app');
module.controller('camerasEditController', function($scope, CamerasService, Windows, $state, selectedCamera, serversList, cameraGroupsList, organizationsList) {
  $scope.cameraGroupsList = cameraGroupsList ? cameraGroupsList.data : [];
  $scope.organizationsList = organizationsList.data;
  $scope.serversList = serversList.data;

  if (selectedCamera) {
    $scope.cameraModel = selectedCamera.data;
    if ($scope.cameraModel.indefinitely) $scope.cameraModel.storage_life = 1000;
    $scope.cameraModel.archive_path = $scope.cameraModel.archive_path || '/home/_VideoArchive';
  } else {
    $scope.cameraModel = {
      archive_path: '/home/_VideoArchive',
      storage_life: 7,
      analysis: 1,
      indefinitely: false,
      compress_level: 1,
      organization: $state.params.organizationId * 1
    };
  }

  if ($scope.cameraModel.camera_group) {
    $scope.cameraModel.camera_group = $scope.cameraModel.camera_group.id;
  }

  var forActivateCameraModel = angular.copy($scope.cameraModel);

  $scope.fpsList = [];
  for (var k = 10; k <= 30; k++) {
    $scope.fpsList.push({
      value: k,
      label: k
    });
  }
  $scope.fpsList.unshift({
    value: 0,
    label: 'Авто'
  });

  $scope.newCamerasGroup = '';

  $scope.resolutionsList = [
    {
      value: 1,
      label: '360'
    },
    {
      value: 2,
      label: '480'
    },
    {
      value: 3,
      label: '720'
    },
    {
      value: 4,
      label: 'HD'
    },
    {
      value: 5,
      label: '2K'
    },
    {
      value: 6,
      label: '4K'
    }
  ];

  $scope.analiseTypesList = {
    1: 'Только запись',
    2: 'Только движение',
    3: 'Полный анализ'
  };

  $scope.saveCamera = function(cameraForm) {
    if (!cameraForm.$valid) {
      return;
    }
    var requestData = angular.copy($scope.cameraModel);
    if (!requestData.camera_group) {
      requestData.camera_group = $scope.newCamerasGroup;
    }
    requestData.storage_life *= 1;
    if (requestData.storage_life == 1000){
      requestData.indefinitely = true
    }
    CamerasService[requestData.id ? 'updateCamera' : 'createCamera'](
      requestData
    ).then(function(response) {
      if (!requestData.id) {
        $state.go('main.administration.cameras.edit', {
          organizationId: $state.params.organizationId,
          cameraId: response.data.id
        });
      } else {
        $scope.cameraGroupsList.push(response.data.camera_group);
        if (response.data.camera_group) {
          response.data.camera_group = response.data.camera_group.id;
        }
        $scope.cameraModel = response.data;
        forActivateCameraModel = angular.copy($scope.cameraModel);
        Windows.alert({
          title: 'Обновление параметров камеры',
          text: 'Камера успешно обновлена'
        });
      }
    });
  };

  $scope.deleteCamera = function() {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function() {
        CamerasService.deleteCamera($scope.cameraModel.id).then(function(
          response
        ) {
          $state.go('main.administration.cameras.list', {
            organizationId: $state.params.organizationId
          });
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление камеры из базы',
      text:
        'Вы действительно хотите удалить камеру ' +
        $scope.cameraModel.name +
        '?'
    });
  };
  $scope.startCamera = function() {
    Windows.confirm({
      confirmText: 'Да, запустить',
      onConfirm: function() {
        forActivateCameraModel.is_active = 1;
        CamerasService.updateCamera(forActivateCameraModel)
          .then(function(response) {
            $scope.cameraModel.is_active = response.data.is_active;
          })
          .then(function() {
            Windows.alert({
              title: 'Запуск камеры',
              text: 'Камера запущена'
            });
          });
      },
      cancelText: 'Отменить',
      title: 'Запуск камеры',
      text:
        'Вы действительно хотите запустить камеру ' +
        $scope.cameraModel.name +
        '?'
    });
  };
  $scope.stopCamera = function() {
    Windows.confirm({
      confirmText: 'Да, остановить',
      onConfirm: function() {
        forActivateCameraModel.is_active = false;
        CamerasService.updateCamera(forActivateCameraModel)
          .then(function(response) {
            $scope.cameraModel.is_active = response.data.is_active;
          })
          .then(function() {
            Windows.alert({
              title: 'Запуск камеры',
              text: 'Камера остановлена'
            });
          });
      },
      cancelText: 'Отменить',
      title: 'Остановка камеры',
      text:
        'Вы действительно хотите остановить камеру "' +
        $scope.cameraModel.name +
        '"?'
    });
  };
});
