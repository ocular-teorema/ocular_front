var module = angular.module('app');
module.controller('notificationsController', function($scope, Windows, NotificationsService, notificationsList, cameraGroupsList, selectedOrganization, usersList, camerasList) {
  
  $scope.notificationsList = notificationsList.data;
  $scope.usersList = usersList.data;
  $scope.camerasList = camerasList.data;
  $scope.cameraGroupsList = cameraGroupsList.data;

  $scope.tableTitles = [
    {
      key: "camera_group",
      name: 'группа камер'
    },
    {
      key: "camera",
      name: 'камера'
    },
    {
      key: "type.name",
      name: 'тип события'
    },
    {
      key: "getter",
      name: 'получатель'
    },
  ]

  $scope.deleteNotification = function(notification) {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function() {
        NotificationsService.deleteNotification(notification.id).then(function() {
          $scope.notificationsList = $scope.notificationsList.filter(function(us) {
            return us !== notification;
          });
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление уведомления из базы',
      text: 'Вы действительно хотите удалить уведомление?'
    });
  };
});
