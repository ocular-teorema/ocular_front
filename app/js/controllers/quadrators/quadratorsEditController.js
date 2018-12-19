var module = angular.module('app');
module.controller('quadratorsEditController', function($scope, QuadratorsService, Windows, selectedQuadrator,
                                                       serversList, camerasList, $state) {

    $scope.serversList = serversList.data;
    $scope.camerasList = camerasList.data;




    $scope.currentQuadrator = selectedQuadrator ? selectedQuadrator.data : {
        cameras: [],
        num_cam_x: 2,
        num_cam_y: 2,
        output_width: 1024,
        output_height: 768,
    };

    var currentResolution =
        ($scope.currentQuadrator.output_width / $scope.currentQuadrator.num_cam_x) /  ($scope.currentQuadrator.output_height / $scope.currentQuadrator.num_cam_y);

    $scope.qudratorSize = {
        num_cam_x: new Array($scope.currentQuadrator.num_cam_x),
        num_cam_y: new Array($scope.currentQuadrator.num_cam_y)
    };

    $scope.$watchGroup(['qudratorSize.num_cam_x.length', 'qudratorSize.num_cam_y.length'], function() {
        if (!($scope.qudratorSize.num_cam_x.length && $scope.qudratorSize.num_cam_y.length)) return;
        $scope.currentQuadrator.cameras =
            $scope.currentQuadrator.cameras.slice(0,
                Math.min(
                    $scope.currentQuadrator.cameras.length,
                    $scope.qudratorSize.num_cam_x.length * $scope.qudratorSize.num_cam_y.length
                )
            );
    });

    /* Select for output cameras stream resolution */

    $scope.resolutionsSelect = [
        {
            size: '4:3',
            values: [[1024], [768]]
        }, {
            size: '16:9',
            values: [[1920], [1080]]
        }, {
            size: '21:9',
            values: [[2560], [1080]]
        }
    ];

    var minRangeResolution = 10;

    $scope.resolutionsSelect.forEach(function(resolution) {
        var newResolution = Math.abs(resolution.values[0]/resolution.values[1] - currentResolution);
        if (minRangeResolution > newResolution) {
            minRangeResolution = newResolution;
            $scope.selectedSize = resolution.values;
        }
    });




    $scope.fpsList = [];
    for (let k = 10; k <= 30; k++) {
        $scope.fpsList.push({
            value: k,
            label: k
        });
    }


    $scope.qualityList = [21, 22, 23, 24, 25, 26, 27];


    var maxStreamWidth = 1920;
    var maxStreamHeight = 1080;

    $scope.updateInProgress = false;
    $scope.saveQuadrator = function(quadratorForm) {
        if (!quadratorForm.$valid) return;
        $scope.currentQuadrator['num_cam_x'] = $scope.qudratorSize.num_cam_x.length;
        $scope.currentQuadrator['num_cam_y'] = $scope.qudratorSize.num_cam_y.length;

        var calculatedHeightSize = Math.ceil((maxStreamWidth / $scope.currentQuadrator['num_cam_x']) / $scope.selectedSize[0] * $scope.selectedSize[1] * $scope.currentQuadrator['num_cam_y']);
        var calculatedWidthSize = Math.ceil((maxStreamHeight / $scope.currentQuadrator['num_cam_y']) / $scope.selectedSize[1] * $scope.selectedSize[0] * $scope.currentQuadrator['num_cam_x']);

        if (calculatedHeightSize < maxStreamHeight) {
            $scope.currentQuadrator['output_width'] = maxStreamWidth;
            $scope.currentQuadrator['output_height'] = calculatedHeightSize;
        } else {
            $scope.currentQuadrator['output_width'] = calculatedWidthSize;
            $scope.currentQuadrator['output_height'] = maxStreamHeight;
        }

        $scope.updateInProgress = true;

        QuadratorsService[
            $scope.currentQuadrator.id ? 'updateQuadrator' : 'createQuadrator'
            ]($scope.currentQuadrator).then(function(response) {
            $scope.currentQuadrator.id ? Windows.alert({
                title: 'Обновление параметров квадратора',
                text: 'Квадратор успешно обновлен'
            }) : Windows.alert({
                title: 'Создание квадратора',
                text: 'Квадратор успешно создан'
            });
            $scope.currentQuadrator = response.data;
            $scope.updateInProgress = false;
        }, function() {
            $scope.updateInProgress = false;
        });
    };


    $scope.deleteQuadrator = function () {
        Windows.confirm({
            confirmText: 'Да, удалить',
            onConfirm: function () {
                QuadratorsService.deleteQuadrator($scope.currentQuadrator.id).then(function () {
                    $state.go('main.administration.quadrators.list');
                });
            },
            cancelText: 'Отменить',
            title: 'Удаление квадратор из базы',
            text: 'Вы действительно хотите удалить квадратор "' + $scope.currentQuadrator.name + '"?'
        });
    };

});

