var module = angular.module('app');
module.controller('quadratorsController', function ($scope, Windows, QuadratorsService, quadratorsList) {

  $scope.quadrators = angular.copy(quadratorsList.data);

  $scope.deleteQuadrator = function (quadrator) {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function () {
          QuadratorsService.deleteQuadrator(quadrator.id).then(function () {
          $scope.quadrators = $scope.quadrators.filter(function (qu) {
            return qu !== quadrator;
          });
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление квадратор из базы',
      text: 'Вы действительно хотите удалить квадратор "' + quadrator.name + '"?'
    });
  };
});