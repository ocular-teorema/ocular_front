var module = angular.module('app');
module.controller('notificationsEditController', function(Windows, $scope, $state, NotificationsService, $timeout, selectedNotification, usersList, cameraGroupsList, camerasList, organizationsList) {

  $scope.notificationTypes = {};
  if (selectedNotification) {
    $scope.notificationModel = selectedNotification.data;
    $scope.notificationModel.notify_time_start = $scope.notificationModel.notify_time_start.slice(0,5)
    $scope.notificationModel.notify_time_stop = $scope.notificationModel.notify_time_stop.slice(0,5)
    $scope.notificationModel.notify_events.forEach(function (type) {
      $scope.notificationTypes[type] = true;
    })
  } else {
    $scope.notificationModel = {};
  }

  $scope.organizationsList = organizationsList.data;

  $scope.usersList = angular.copy(usersList.data);
  $scope.selectedUsers = [];

  $scope.timesList = [];
  var timeRange = 30;
  for (var t = 0; t < 1440; t += timeRange) {
      var h = Math.floor(t / 60);
      var m = t % 60;
      h = (h < 10 ? '0' : '') + h;
      m = (m < 10 ? '0' : '') + m;
      $scope.timesList.push(h + ':' + m);
  }

  $scope.displayingList = [
    {
        label: "высокий",
        value: 80
    }, {
        label: "средний и высокий",
        value: 50
    }, {
        label: "все уровни",
        value: 0
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
  $scope.usersSelectOptions = {
    class: 'hidden-select select-3',
    label: 'fio',
    value: '',
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

  if ($scope.notificationModel.cameras_access && $scope.notificationModel.cameras_access.groups) {
    var selectedGroups = [];
    var selectedCameras = [];
    $scope.notificationModel.cameras_access.groups.map(function (group) {
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

  $scope.onSelectUser = function (user) {
    $scope.selectedUsers.push(user);
  }

  $scope.removeUser = function (user) {
    var userIndex = $scope.selectedUsers.indexOf(user);
    $scope.selectedUsers.splice(userIndex, 1);
  }

  $scope.saveNotification = function (notificationForm) {
    if (!notificationForm.$valid) return;

    var request = angular.copy($scope.notificationModel);

    if ($scope.selectedGroups.length === 0 ) {
      request.camera_group = $scope.cameraGroupsList.map(function (group) {
        return group.id        
      })    
    } else {
      request.camera_group = $scope.selectedGroups.map(function (group) {
        return group.id
      })
    }
    if ($scope.selectedCameras.length === 0) {
      request.camera = $scope.camerasList.map(function (camera) {
        return camera.id;
      })
    } else {
      request.camera = $scope.selectedCameras.map(function (camera) {
        return camera.id
      })
    }
    if ($scope.selectedUsers.length === 0) {
      request.users = $scope.usersList.map(function (user) {
        return user.id;
      })
    } else {
      request.users = $scope.selectedUsers.map(function (user) {
        return user.id
      })
    }
    request.notify_events = [];
    for (var key in $scope.notificationTypes) {
      request.notify_events.push(key)
    }
    if (request.camera[0] === 0) request.camera.splice(0, 1);
    if (request.camera_group[0] === 0) request.camera_group.splice(0, 1);
    NotificationsService.saveNotification(request).then(function (response) {
      if (!request.id) {
        $state.go('main.administration.notifications.list');
      } else {
        Windows.alert({
          title: 'Обновление параметров уведомления',
          text: 'Уведомление успешно обновлено'
        });
      }
    });
  };

  $scope.deleteNotification = function () {
    if (!$scope.notificationModel.id) return;
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function () {
        NotificationsService.deleteNotification($scope.notificationModel.id).then(function () {
          $state.go('main.administration.notifications.list');
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление уведомления из базы',
      text: 'Вы действительно хотите удалить уведомление?'
    });
  };

});
