var module = angular.module('app');
module.controller('mainController', function($scope, currentUser, $rootScope, $state, userCameras) {
    $rootScope.currentUser = currentUser.data;
    $rootScope.userCameras = userCameras.data;

    $rootScope.daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'ПТ', 'Сб'];
    // var types = ['record-analize', 'motion-analize', 'full-analize'];
    //
    // $rootScope.userCameras.groups.map(function(group) {
    //     var cameras = group.cameras;
    //     cameras.map(function(cam) {
    //         cam['analysis-icon'] = types[cam.analysis - 1];
    //         cam.group = {
    //             id: group.id,
    //             name: group.name
    //         };
    //     });
    // });
    $rootScope.userCameras.groups.forEach(group => {
      group.cameras = _.sortBy(group.cameras, [function (cam) {
        return cam.name
      }])
    });
});
