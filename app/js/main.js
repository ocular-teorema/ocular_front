'use strict';
angular.module('Services', []);
angular.module('Constants', []);
angular.module('Directives', []);
angular.module('Filters', []);

var module = angular.module('app', ['ui.router', 'ui.bootstrap.datetimepicker', 'ui.bootstrap.modal', 'uib/template/modal/window.html',
    'Constants', 'Services', 'Directives', 'Filters', 'ngSanitize']);

module.controller('baseController', function($scope) {

}).controller('mainMenuController', function($scope, $rootScope, Menu) {
    $scope.mainMenu = Menu;
}).controller('subMenuController', function($scope, $state, Submenu, settingsAdminMenu) {
    $scope.Submenu = ($state.current.parent === 'main.administration') ? Submenu : settingsAdminMenu;
}).filter('adminMenu', function (Menu, $rootScope) {
    var user = $rootScope.currentUser;
    return function(menuItem) {
        if (menuItem.isAdminMenu) {
            return (user.is_staff || user.is_organization_admin)
        } else if (menuItem.isAdminSettingsMenu) {
          return (user.is_staff)
        } else {
            return true
        }
    };
}).filter('nameById', function () {
  return function (idArr, users) {
    var namesArr = [];
    idArr.forEach(function(id) {
      users.forEach(user => {
        if (user.id == id) namesArr.push(user.fio)
      });
    });
    return namesArr.join(', ');
  }
}).filter('cameraById', function () {
  return function (idArr, cameras) {
    if (!idArr) return '-';
    var camerasArr = [];
    idArr.forEach(function(id) {
      cameras.forEach(camera => {
        if (camera.id == id) camerasArr.push(camera.name)
      });
    });
    return camerasArr.join(', ');
  }
}).filter('typeByCode', function (NotificationType) {
  return function (typeArr) {
    if (!typeArr || typeArr.length === 0) return '-'
    typeArr = typeArr.map(function (type) {
      return NotificationType[type];
    })
    return typeArr.join(', ');
  }
}).filter('typeByEvent', function (EventsDescription) {
  return function (type) {
    switch (type) {
      case EventsDescription.ALERT_TYPE_AREA:
        return 'Движение в зоне'
        break;

      case EventsDescription.ALERT_TYPE_CALIBRATION_ERROR:
        return 'Ошибка калибровки'
        break;

      case EventsDescription.ALERT_TYPE_INVALID_MOTION:
        return 'Вектор движения'
        break;

      case EventsDescription.ALERT_TYPE_VELOCITY:
        return 'Скорость движения'
        break;

      case EventsDescription.ALERT_TYPE_STATIC_OBJECT:
        return 'Оставленный предмет'
        break;

      case EventsDescription.ALERT_TYPE_PEOPLE_COUNT:
        return 'Толпа'
        break;
    
      default:
        break;
    }
  }
}).filter('confidenceLevel', function () {
  return function (level) {
    if (level < 50) {
      return 'Низкий';
    } else if ( level < 80) {
      return 'Средний';
    } else {
      return 'Высокий';
    }
  }
}).filter('isCompanyMenu', function (Menu, $rootScope) {
  return function (states) {

    var newStates = states;

    if ($rootScope.TEOREMA_TYPE === 'company') {
       newStates = _.filter(states, function (state) {
        return !state.isAdminMenu
      })
    }
    
    return newStates;
  }
}).config(function($locationProvider, $httpProvider, $urlRouterProvider) {
    
    //$urlRouterProvider.rule(function($injector, $location) {
    //    var path = $location.path();
    //    var isTrailingSlashExist = path[path.length-1] === '/';
    //    if (!isTrailingSlashExist) {
    //        path = path + '/';
    //    }
    //    return path;
    //});
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    })
}).run(function($state, $rootScope) {
    $rootScope.state = $state;
    localStorage.setItem('htmlCameraMode', 'webrtc');
    $rootScope.htmlCameraMode = 'webrtc';
    
    // var cameraStreamProtocol = localStorage.getItem('htmlCameraMode');
    // if (cameraStreamProtocol) {
    //     $rootScope.htmlCameraMode = cameraStreamProtocol;
    // } else {
    //     localStorage.setItem('htmlCameraMode', 'html');
    //     $rootScope.htmlCameraMode = 'html';
    // }
    // $rootScope.toggleCameraHttpMode = function(type) {
    //     var mode = localStorage.getItem('htmlCameraMode');
    //     localStorage.setItem('htmlCameraMode', type);
    //     window.location.reload();
    // }
});
