var module = angular.module('app');
module.controller('quadratorsEditController', function($scope, QuadratorsService, Windows, selectedQuadrator,
                                                       serversList, camerasList, $state, $timeout) {

    $scope.serversList = serversList.data;
    $scope.camerasList = camerasList.data;

    $scope.camerasList.forEach(function(cam) {
        cam.serverModel = $scope.serversList.filter(function(server) {
            return server.id === cam.server;
        })[0];
    });

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

    $scope.$watchGroup(['qudratorSize.num_cam_x.length', 'qudratorSize.num_cam_y.length'], function(newValues, oldValues) {

        if (!($scope.qudratorSize.num_cam_x.length && $scope.qudratorSize.num_cam_y.length)) return;

        var oldX = oldValues[0];
        var newX = newValues[0];

        var oldY = oldValues[1];
        var newY = newValues[1];

        // if (newX < oldX) {
        //     $scope.currentQuadrator.cameras = $scope.currentQuadrator.cameras.filter(function(camera, index) {
        //         return (index + 1) % oldX;
        //     });
        //     $scope.quadratorParams = $scope.quadratorParams.filter(function(camParam, index) {
        //         var isHidden = !(index + 1) % oldX;
        //
        //         if (camParam.hidden) {
        //             camParam.parentItem.cols--;
        //             camParam.parentItem.toRight--;
        //         }
        //         return !isHidden;
        //     });
        // } else if (newX > oldX) {
        //     for (var k = 0; k < $scope.qudratorSize.num_cam_y.length; k++) {
        //         var newIndex = oldX  + $scope.currentQuadrator.num_cam_x * k + k;
        //         $scope.quadratorParams.splice(newIndex, 0, false);
        //         iniCameraQuadratorParams(newIndex);
        //         $scope.currentQuadrator.cameras.splice(newIndex, 0, $scope.camerasList[0]);
        //     }
        // } else if (newY < oldY) {
        //     $scope.currentQuadrator.cameras = $scope.currentQuadrator.cameras.filter(function(camera, index) {
        //         return index > $scope.qudratorSize.num_cam_x * newY - 1;
        //     });
        //     $scope.quadratorParams = $scope.quadratorParams.filter(function(camParam, index) {
        //         if (camParam.hidden) {
        //             camParam.parentItem.rows--;
        //             camParam.parentItem.toBottom--;
        //         }
        //         return index > $scope.qudratorSize.num_cam_x * newY - 1;
        //     });
        // } else if (newY > oldY) {
        //
        // }

        fixCamerasButtons();
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
            $scope.selectedSize = resolution;
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

        var calculatedHeightSize = Math.ceil((maxStreamWidth / $scope.currentQuadrator['num_cam_x']) / $scope.selectedSize.values[0] * $scope.selectedSize.values[1] * $scope.currentQuadrator['num_cam_y']);
        var calculatedWidthSize = Math.ceil((maxStreamHeight / $scope.currentQuadrator['num_cam_y']) / $scope.selectedSize.values[1] * $scope.selectedSize.values[0] * $scope.currentQuadrator['num_cam_x']);

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


    $scope.$watch('currentQuadrator.cameras', function(newVal, oldVal) {
        // console.log(newVal);
    });


    $scope.quadratorParams = [];

    var iniCameraQuadratorParams = function(index) {
        var cameraParams = $scope.quadratorParams[index];
        $scope.quadratorParams[index] = cameraParams || {
            cols: 1,
            rows: 1,
            toLeft: 0,
            toRight: 0,
            toBottom: 0,
            toUp: 0,
            childs: []
        };

    };

    var fixCamerasButtons = function() {
        $scope.currentQuadrator.cameras.forEach(function(cam, index) {
            iniCameraQuadratorParams(index);
            var params = $scope.quadratorParams[index];
            params.buttons = {
                up: true,
                down: true,
                left: true,
                right: true
            };
        });

        for (var yIndex  = 0; yIndex  < $scope.qudratorSize.num_cam_y.length; yIndex ++) {
            for (var xIndex = 0; xIndex < $scope.qudratorSize.num_cam_x.length; xIndex++) {
                var ind = xIndex + yIndex * $scope.qudratorSize.num_cam_x.length;

                var params = $scope.quadratorParams[ind];
                if (!params || params.hidden) continue;
                if (params.toLeft === xIndex) {
                    params.buttons['left'] = false;
                }

                if ((params.toRight + xIndex) === ($scope.qudratorSize.num_cam_x.length - 1)) {
                    params.buttons['right'] = false;
                }

                if (params.toUp === yIndex) {
                    params.buttons['up'] = false;
                }

                if ((params.toBottom + yIndex) === ($scope.qudratorSize.num_cam_y.length - 1)) {
                    params.buttons['down'] = false;
                }

                if (params.cols > 1 || params.rows > 1) {
                    for (var x = xIndex - params.toLeft - 1; x <= xIndex + params.toRight + 1; x++) {
                        var firstLastIteration = (x === xIndex - params.toLeft - 1) || (x === xIndex + params.toRight + 1) ? 0 : 1;
                        for (
                            var y = (yIndex - params.toUp - firstLastIteration);
                            y <= (yIndex + params.toBottom + firstLastIteration);
                            y++
                        ) {
                            var firstLastYIteration = (y === yIndex - params.toUp - 1) || (y === yIndex + params.toBottom + 1);
                            var otherIndex = x + y * $scope.qudratorSize.num_cam_x.length;
                            if (otherIndex !== ind) {
                                var otherParams = $scope.quadratorParams[otherIndex];
                                if (!otherParams) continue;
                                otherParams = otherParams.parentItem || otherParams;
                                if (otherParams !== params) {
                                    if (!firstLastYIteration) {
                                        if (x > xIndex) {
                                            otherParams.buttons.left = false;
                                        } else {
                                            otherParams.buttons.right = false;
                                        }
                                    }
                                    if (firstLastIteration) {
                                        if (y > yIndex) {
                                            otherParams.buttons.up = false;
                                        } else {
                                            otherParams.buttons.down = false;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    $scope.resetCamSize = function(cameraIndex, direction) {
        var params = $scope.quadratorParams[cameraIndex];
        var childs;
        switch (direction) {
            case 'up':
                params.toUp--;
                params.rows--;
                break;
            case 'down':
                childs = params.childs.filter(function(child) {
                    return (child.direction === 'down') && (child.value === params.toBottom)
                });
                params.toBottom--;
                params.rows--;
                break;
            case 'left':
                childs = params.childs.filter(function(child) {
                    return (child.direction === 'left') && (child.value === params.toLeft)
                });
                params.toLeft--;
                params.cols--;
                break;
            case 'right':
                childs = params.childs.filter(function(child) {
                    return (child.direction === 'right') && (child.value === params.toRight)
                });
                params.toRight--;
                params.cols--;
                break;
        }

        var allChilds = params.childs.filter(function(child) {
            return childs.filter(function(forReset) {
                return child.params === forReset.params;
            }).length;
        });
        allChilds.forEach(function(child) {
            child.params.hidden = false;
            child.params.parentItem = undefined;
        });

        params.childs = params.childs.filter(function(child) {
            return allChilds.indexOf(child) === -1;
        });

        fixCamerasButtons();
        iniDisplayingSizeCamera(params);
    };

    $scope.setNewSize = function(cameraIndex, direction) {
        iniCameraQuadratorParams(cameraIndex);
        var currParams = $scope.quadratorParams[cameraIndex];
        switch (direction) {
            case 'up':
                currParams.rows++;

                var firstCamPreview = cameraIndex - currParams.toLeft - $scope.qudratorSize.num_cam_x.length;
                $scope.currentQuadrator.cameras[firstCamPreview] =
                    $scope.currentQuadrator.cameras[cameraIndex];

                for (
                    var i = cameraIndex - currParams.toLeft;
                    i <= cameraIndex + currParams.toRight;
                    i++
                ) {
                    var prevIndex = i - $scope.qudratorSize.num_cam_x.length;
                    iniCameraQuadratorParams(prevIndex);
                    if (i === (cameraIndex - currParams.toLeft)) {
                        var original = {
                            camera: $scope.currentQuadrator.cameras[prevIndex],
                            params: $scope.quadratorParams[prevIndex]
                        };
                        $scope.quadratorParams[prevIndex].rows = currParams.rows;
                        $scope.quadratorParams[prevIndex].cols = currParams.cols;
                        $scope.quadratorParams[prevIndex].toRight = currParams.cols - 1;
                        $scope.quadratorParams[prevIndex].toBottom = $scope.quadratorParams[prevIndex].rows - 1;

                        $scope.quadratorParams[prevIndex].original = original;
                        $scope.quadratorParams[prevIndex].replacer = currParams;

                        currParams.hidden = true;
                        currParams.parentItem = $scope.quadratorParams[prevIndex];
                    } else {
                        $scope.quadratorParams[prevIndex].hidden = true;
                        $scope.quadratorParams[prevIndex].parentItem = currParams;
                    }
                }
                break;
            case 'down':
                currParams.rows++;
                currParams.toBottom++;
                for (
                    var i = cameraIndex - currParams.toLeft;
                    i <= cameraIndex + currParams.toRight;
                    i++
                ) {
                    var nextIndex = i + currParams.toBottom * $scope.qudratorSize.num_cam_x.length;
                    iniCameraQuadratorParams(nextIndex);
                    $scope.quadratorParams[nextIndex].hidden = true;
                    $scope.quadratorParams[nextIndex].parentItem = currParams;

                    currParams.childs.push({
                        value: currParams.toBottom,
                        direction: 'down',
                        params: $scope.quadratorParams[nextIndex]
                    });
                    if (i < cameraIndex) {
                        currParams.childs.push({
                            value: cameraIndex - i,
                            direction: 'left',
                            params: $scope.quadratorParams[nextIndex]
                        });
                    }
                    if (i > cameraIndex) {
                        currParams.childs.push({
                            value: i - cameraIndex,
                            direction: 'right',
                            params: $scope.quadratorParams[nextIndex]
                        });
                    }
                }
                break;
            case 'left':
                currParams.cols++;
                currParams.toLeft++;
                for (var h = 0; h < currParams.rows; h++) {
                    var prevIndex =
                        cameraIndex - currParams.toLeft + h * $scope.qudratorSize.num_cam_x.length;
                    iniCameraQuadratorParams(prevIndex);
                    $scope.quadratorParams[prevIndex].hidden = true;
                    $scope.quadratorParams[prevIndex].parentItem = currParams;

                    currParams.childs.push({
                        value: currParams.toLeft,
                        direction: 'left',
                        params: $scope.quadratorParams[prevIndex]
                    });

                    if (h > 0) {
                        currParams.childs.push({
                            value: h,
                            direction: 'down',
                            params: $scope.quadratorParams[prevIndex]
                        });
                    }
                }

                break;
            case 'right':
                $scope.quadratorParams[cameraIndex].cols++;
                $scope.quadratorParams[cameraIndex].toRight++;
                for (var h = 0; h < $scope.quadratorParams[cameraIndex].rows; h++) {
                    var nextIndex =
                        cameraIndex + $scope.quadratorParams[cameraIndex].toRight + h * $scope.qudratorSize.num_cam_x.length;
                    iniCameraQuadratorParams(nextIndex );
                    $scope.quadratorParams[nextIndex].hidden = true;
                    $scope.quadratorParams[nextIndex].parentItem = $scope.quadratorParams[cameraIndex];
                    currParams.childs.push({
                        value: currParams.toRight,
                        direction: 'right',
                        params: $scope.quadratorParams[nextIndex]
                    });


                    if (h > 0) {
                        currParams.childs.push({
                            value: h,
                            direction: 'down',
                            params: $scope.quadratorParams[nextIndex]
                        });
                    }
                }
                break;
        }

        iniDisplayingSizeCamera($scope.quadratorParams[cameraIndex]);
        fixCamerasButtons();
    };

    var iniDisplayingSizeCamera = function(params) {
        params.width = 200 * Math.min(params.rows, params.cols);
    };

});

