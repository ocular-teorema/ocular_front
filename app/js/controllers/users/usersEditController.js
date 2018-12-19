var module = angular.module('app');
module.controller('usersEditController', function ($scope, $state, $timeout, $rootScope, selectedUser, currentUser, selectedUser, organizationsList, UsersService, cameraGroupsList, camerasList, Windows) {

  $scope.organizationsList = organizationsList.data
  
  if (selectedUser) {
    $scope.userModel = selectedUser.data
  } else {
    $scope.userModel = {
      organization: $state.params.organizationId * 1
    };
  }

  $scope.userRolesList = [
    {
      label: 'Охранник',
      value: false
    }, {
      label: 'Главный охранник',
      value: true
    }
  ];

  $scope.cameraGroupsList = angular.copy(cameraGroupsList.data);
  var setUndefinedOption = function () {
    $scope.cameraGroupsList.unshift({
      id: 0,
      information: true,
      name: 'Выберите группу'
    });
  };
  setUndefinedOption();

  var setUndefinedCameraOption = function () {
    $scope.camerasList.unshift({
      id: 0,
      information: true,
      name: 'Выберите камеру'
    });
  };

  $scope.groupsSelectOptions = {
    class: 'hidden-select select-3',
    label: 'name',
    value: 'id',
    showed: false
  };
  $scope.camerasSelectOptions = {
    class: 'hidden-select select-3',
    label: 'name',
    value: 'id',
    showed: false
  };

  /* Группы */
  $scope.selectedGroups = [];
  var onCheckList = false;

  var checkGroupsList = function () {
    onCheckList = true;
    $scope.cameraGroupsList = cameraGroupsList.data.filter(function (gr) {
      return !$scope.selectedGroups.filter(function (selectedGr) {
        return selectedGr.id === gr.id;
      }).length
    });
    setUndefinedOption();
    checkCamerasList();
    $timeout(function () {
      onCheckList = false;
    });
  };

  $scope.onSelectGroup = function (group) {
    if (onCheckList) return;
    $scope.selectedGroups.push($scope.cameraGroupsList.filter(function (gr) {
      return gr.id === group;
    })[0]);
    checkGroupsList();
  };

  $scope.removeGroup = function (group) {
    $scope.selectedGroups = $scope.selectedGroups.filter(function (gr) {
      return gr !== group;
    });
    checkGroupsList();
  };

  /* Камеры */

  var onCheckCamerasList = false;
  var checkCamerasListAfterSelect = function () {
    onCheckCamerasList = true;
    $scope.camerasList = accessCameras.filter(function (cam) {
      return !$scope.selectedCameras.filter(function (selectedCam) {
        return selectedCam.id === cam.id;
      }).length
    });
    setUndefinedCameraOption();
    $timeout(function () {
      onCheckCamerasList = false;
    });
  };

  $scope.onSelectCamera = function (camera) {
    if (onCheckCamerasList) return;
    $scope.selectedCameras.push($scope.camerasList.filter(function (cam) {
      return cam.id === camera;
    })[0]);
    checkCamerasListAfterSelect();
  };

  $scope.removeCamera = function (camera) {
    $scope.selectedCameras = $scope.selectedCameras.filter(function (cam) {
      return cam !== camera;
    });
    checkCamerasListAfterSelect();
  };

  $scope.selectedCameras = [];
  var accessCameras = [];
  var checkCamerasList = function () {
    onCheckCamerasList = true;
    if (!$scope.selectedGroups.length) {
      accessCameras = angular.copy(camerasList.data);
    } else {
      accessCameras = angular.copy(camerasList.data.filter(function (camera) {
        return $scope.selectedGroups.filter(function (gr) {
          return gr.id === camera.camera_group.id;
        }).length;
      }));
    }
    $scope.camerasList = angular.copy(accessCameras);
    setUndefinedCameraOption();
    $scope.selectedCameras = $scope.selectedCameras.filter(function (selectedCam) {
      return accessCameras.filter(function (accessCam) {
        return selectedCam.id === accessCam.id;
      }).length;
    });
    checkCamerasListAfterSelect();
    $timeout(function () {
      onCheckCamerasList = false;
    });
  };

  if ($scope.userModel.cameras_access && $scope.userModel.cameras_access.groups) {
    var selectedGroups = [];
    var selectedCameras = [];
    $scope.userModel.cameras_access.groups.map(function (group) {
      selectedGroups.push(cameraGroupsList.data.filter(function (gr) {
        return gr.id === group.group;
      })[0]);
      selectedCameras = selectedCameras.concat(camerasList.data.filter(function (cam) {
        return group.cameras.indexOf(cam.id) !== -1;
      }));
    });
    $scope.selectedCameras = angular.copy(selectedCameras);
    $scope.selectedGroups = angular.copy(selectedGroups);
    checkGroupsList();
    checkCamerasList();
  } else {
    checkCamerasList();
  }

  $scope.deleteUser = function () {
    if (!$scope.userModel.id) return;
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function () {
        UsersService.deleteUser($scope.userModel.id).then(function () {
          $state.go('main.administration.users.list');
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление пользователя из базы',
      text: 'Вы действительно хотите удалить пользователя ' + $scope.userModel.fio + '?'
    });
  };

  $scope.saveUser = function (userForm) {
    if (!userForm.$valid) return;
    var userCamerasAccess = {
      groups: []
    };

    var selectedCameras = {};

    $scope.selectedCameras.map(function (camera) {
      selectedCameras[camera.camera_group.id] = selectedCameras[camera.camera_group.id] || [];
      selectedCameras[camera.camera_group.id].push(camera.id);
    });

    $scope.selectedGroups.map(function (group) {
      userCamerasAccess.groups.push({
        group: group.id,
        cameras: selectedCameras[group.id] || []
      });
    });



    var request = angular.copy($scope.userModel);
    request.cameras_access = userCamerasAccess;
    UsersService.saveUser(request).then(function (response) {
      if (!request.id) {
        var user = response.data;
        $state.go('main.administration.users.list', { userId: user.id });
      } else {
        Windows.alert({
          title: 'Обновление параметров пользователя',
          text: 'Пользователь успешно обновлен'
        });
      }
    });
  };


});
