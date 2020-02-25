var module = angular.module('app');
module.controller('quadratorsEditController', function ($scope, QuadratorsService, Windows, selectedQuadrator,
    serversList, camerasList, $state, $timeout) {

    $scope.serversList = serversList.data;
    var noCamera = { id: null, name: "Не выбрана" };
    $scope.camerasList = [noCamera];
    camerasList.data.forEach(function (cam) {
        $scope.camerasList.push(cam);
    });

    $scope.camerasList.forEach(function (cam) {
        cam.serverModel = $scope.serversList.filter(function (server) {
            return server.id === cam.server;
        })[0];
    });

    $scope.quadratorParams = [];

    var iniCameraQuadratorParams = function (index) {
        var cameraParams = $scope.quadratorParams[index];
        $scope.quadratorParams[index] = cameraParams || {
            cols: 1,
            rows: 1,
            toLeft: 0,
            toRight: 0,
            toBottom: 0,
            toUp: 0,
            childs: [],
            index: index,
            camera: noCamera,
            buttons: {
                up: true,
                down: true,
                left: true,
                right: true
            }
        };
        return $scope.quadratorParams[index];
    };

    var loadData = function (data) {
        $scope.currentQuadrator = data;
        for (var k = 0; k < data.num_cam_x * data.num_cam_y; k++)
            iniCameraQuadratorParams(k);
        data.cameras.forEach(function (cam, index) {
            var params = $scope.quadratorParams[cam.y * data.num_cam_x + cam.x];
            params.camera = $scope.camerasList.filter(function (c) { return c.id === cam.camera_id; })[0];
            params.rows = cam.rows || 1;
            params.cols = cam.cols || 1;
            params.toRight = cam.cols - 1;
            params.toBottom = cam.rows - 1;
            for (var h = 0; h < cam.rows; h++) {
                for (var l = 0; l < cam.cols; l++) {
                    if (h !== 0 || l !== 0) {
                        var childCell = $scope.quadratorParams[(cam.y + h) * data.num_cam_x + (cam.x + l)];
                        childCell.parentItem = params;
                        childCell.hidden = true;
                        params.childs.push({
                            value: l === 0 ? h : l,
                            direction: l === 0 ? 'down' : 'right',
                            params: childCell
                        });
                    }
                }
            }
        });
    };

    loadData(selectedQuadrator ? selectedQuadrator.data : {
        cameras: [],
        num_cam_x: 2,
        num_cam_y: 2,
        output_width: 1024,
        output_height: 768,
    });

    var currentResolution =
        ($scope.currentQuadrator.output_width / $scope.currentQuadrator.num_cam_x) / ($scope.currentQuadrator.output_height / $scope.currentQuadrator.num_cam_y);

    $scope.qudratorSize = {
        num_cam_x: new Array($scope.currentQuadrator.num_cam_x),
        num_cam_y: new Array($scope.currentQuadrator.num_cam_y)
    };

    $scope.$watchGroup(['qudratorSize.num_cam_x.length', 'qudratorSize.num_cam_y.length'], function (newValues, oldValues) {

        if (!($scope.qudratorSize.num_cam_x.length && $scope.qudratorSize.num_cam_y.length))
            return;

        var oldX = oldValues[0];
        var newX = newValues[0];

        var oldY = oldValues[1];
        var newY = newValues[1];

        if (newX < oldX) {
            var newQuadratorParams = [];
            $scope.quadratorParams.map(function (camParam, index) {
                if (!((index + 1) % oldX)) {
                    if (camParam.hidden) {
                        camParam.parentItem.cols--;
                        camParam.parentItem.toRight--;
                        camParam.parentItem.childs = camParam.parentItem.childs.filter(function (camChild) {
                            return camChild.params !== camParam;
                        });
                        iniDisplayingSizeCamera(camParam.parentItem);
                    } else if (camParam.toLeft) {
                        camParam.toLeft--;
                        camParam.cols--;
                        camParam.childs = camParam.childs.filter(function (camChild) {
                            return camChild.params !== newQuadratorParams[index - 1];
                        });
                        newQuadratorParams[index - 1] = camParam;
                        console.log(camParam);
                        iniDisplayingSizeCamera(camParam);
                    }
                } else {
                    newQuadratorParams.push(camParam);
                }
            });
            $scope.quadratorParams = newQuadratorParams;

        } else if (newX > oldX) {
            for (var k = 0; k < $scope.qudratorSize.num_cam_y.length; k++) {
                var newIndex = oldX + oldX * k + k * (newX - oldX);
                for (var rowCams = 0; rowCams < newX - oldX; rowCams++) {
                    $scope.quadratorParams.splice(newIndex, 0, false);
                }
                iniCameraQuadratorParams(newIndex);
            }
        } else if (newY < oldY) {
            $scope.quadratorParams = $scope.quadratorParams.filter(function (camParam, index) {
                return index < newX * newY;
            });

            for (var h = 0; h < newY; h++) {
                for (var l = 0; l < newX; l++) {
                    var param = $scope.quadratorParams[h * newX + l];
                    var topElement = param;
                    if (topElement.parentItem && topElement.parentItem.index < topElement.index)
                        topElement = topElement.parentItem;
                    var shrinkRows = topElement.rows + h - newY;
                    if (shrinkRows > 0) {
                        param.toBottom -= shrinkRows;
                        param.rows -= shrinkRows;
                    }
                }
            }
        } else if (newY > oldY) {
            for (var k = oldY * oldX; k < newY * newX; k++) {
                iniCameraQuadratorParams(k);
            }
        }

        $scope.quadratorParams.map(function (camParam, index) {
            camParam.index = index;
        });
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

    $scope.cellWidth = 200;

    $scope.$watch('selectedSize', function (newVal, oldVal) {
        $scope.cellHeight = $scope.cellWidth * newVal.values[1] / newVal.values[0];
    });

    var minRangeResolution = 10;

    $scope.resolutionsSelect.forEach(function (resolution) {
        var newResolution = Math.abs(resolution.values[0] / resolution.values[1] - currentResolution);
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
    


    $scope.quadResolutions = [
        {
            size: '1280x720',
            values: [1280, 720]
        }, {
            size: '1920x1080',
            values: [1920,1080]
        }
    ];

    var maxStreamWidth = 1920;
    var maxStreamHeight = 1080;
    console.log(maxStreamWidth,maxStreamHeight);

    $scope.$watch('selectedQuadResolution', function (newVal, oldVal) {
        console.log(newVal)
        maxStreamWidth = newVal.values[0];
        maxStreamHeight = newVal.values[1];

        console.log(maxStreamWidth,maxStreamHeight);
    });

    // var maxStreamWidth = $scope.selectedQuadResolution.values[0];
    // var maxStreamHeight = $scope.selectedQuadResolution.values[1];



    $scope.updateInProgress = false;
    $scope.saveQuadrator = function (quadratorForm) {
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
        console.log('save');
        console.log(maxStreamWidth,maxStreamHeight);
        console.log('output value');
        console.log($scope.currentQuadrator['output_width'],$scope.currentQuadrator['output_height']);

        $scope.currentQuadrator.cameras = [];
        $scope.quadratorParams.forEach(function (params, index) {
            if (!params.hidden) {
                if (params.replacer)
                    params = params.replacer;
                if (params.camera.id) {
                    var cellX = index % $scope.currentQuadrator.num_cam_x;
                    var cellY = (index - cellX) / $scope.currentQuadrator.num_cam_x;
                    $scope.currentQuadrator.cameras.push({
                        camera_id: params.camera.id,
                        x: cellX,
                        y: cellY,
                        rows: params.rows,
                        cols: params.cols
                    });
                }
            }
        });

        $scope.updateInProgress = true;

        QuadratorsService[
            $scope.currentQuadrator.id ? 'updateQuadrator' : 'createQuadrator'
        ]($scope.currentQuadrator).then(function (response) {
            $scope.currentQuadrator.id ? Windows.alert({
                title: 'Обновление параметров квадратора',
                text: 'Квадратор успешно обновлен'
            }) : Windows.alert({
                title: 'Создание квадратора',
                text: 'Квадратор успешно создан'
            });
            loadData(response.data);
            $scope.updateInProgress = false;
        }, function () {
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

    function fixCamerasButtons() {
        for (var k = 0; k < $scope.qudratorSize.num_cam_y.length * $scope.qudratorSize.num_cam_x.length; k++) {
            var params = iniCameraQuadratorParams(k);
            params.buttons = {
                up: true,
                down: true,
                left: true,
                right: true
            };
        }

        for (var yIndex = 0; yIndex < $scope.qudratorSize.num_cam_y.length; yIndex++) {
            for (var xIndex = 0; xIndex < $scope.qudratorSize.num_cam_x.length; xIndex++) {
                var ind = xIndex + yIndex * $scope.qudratorSize.num_cam_x.length;
                var params = $scope.quadratorParams[ind];
                if (!params /* || params.hidden */) continue;
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
                    for (var x = Math.max(xIndex - params.toLeft - 1, 0); x <= Math.min(xIndex + params.toRight + 1, $scope.qudratorSize.num_cam_y.length); x++) {
                        var firstLastIteration = (x === Math.max(xIndex - params.toLeft - 1, 0)) ||
                            (x === Math.min(xIndex + params.toRight + 1, $scope.qudratorSize.num_cam_y.length)) ? 0 : 1;
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

    $scope.resetCamSize = function (cameraIndex, direction) {
        var params = $scope.quadratorParams[cameraIndex];
        var childs;
        switch (direction) {
            case 'up':
                childs = params.childs.filter(function (child) {
                    return (child.direction === 'up') && (child.value === params.toUp)
                });

                params.toUp--;
                params.rows--;

                break;
            case 'down':
                childs = params.childs.filter(function (child) {
                    return (child.direction === 'down') && (child.value === params.toBottom)
                });
                params.toBottom--;
                params.rows--;
                break;
            case 'left':
                childs = params.childs.filter(function (child) {
                    return (child.direction === 'left') && (child.value === params.toLeft)
                });
                params.toLeft--;
                params.cols--;
                break;
            case 'right':
                childs = params.childs.filter(function (child) {
                    return (child.direction === 'right') && (child.value === params.toRight)
                });
                params.toRight--;
                params.cols--;
                break;
        }

        if (childs) {
            var allChilds = params.childs.filter(function (child) {
                return childs.filter(function (forReset) {
                    return child.params === forReset.params;
                }).length;
            });
            allChilds.forEach(function (child) {
                child.params.hidden = false;
                child.params.parentItem = undefined;
                child.params.replacer = undefined;
            });

            params.childs = params.childs.filter(function (child) {
                return allChilds.indexOf(child) === -1;
            });

            var topLeftCell = getTopLeftCell(params);
            topLeftCell.replacer = params;
            topLeftCell.hidden = false;
        }

        fixCamerasButtons();
        iniDisplayingSizeCamera(params);
    };

    var getTopLeftCell = function (params) {
        var visibleChild = null;
        params.childs.forEach(function (child) {
            if (((child.direction === 'up' && child.value === params.toUp) ||
                (child.direction === 'left' && child.value === params.toLeft)) &&
                (!visibleChild || visibleChild.index > child.params.index))
                visibleChild = child.params;
        });
        return visibleChild || params;
    };

    $scope.getCameraIndex = function (x, y) {
        var index = y * $scope.qudratorSize.num_cam_x.length + x;
        if (index < $scope.quadratorParams.length && $scope.quadratorParams[index].replacer)
            index = $scope.quadratorParams[index].replacer.index;
        return index;
    };

    $scope.setNewSize = function (cameraIndex, direction) {
        iniCameraQuadratorParams(cameraIndex);
        var currParams = $scope.quadratorParams[cameraIndex];
        debugger;
        switch (direction) {
            case 'up':
                getTopLeftCell(currParams).hidden = true;

                currParams.rows++;
                currParams.toUp++;

                for (
                    var i = cameraIndex - currParams.toLeft;
                    i <= cameraIndex + currParams.toRight;
                    i++
                ) {
                    var prevIndex = i - $scope.qudratorSize.num_cam_x.length * currParams.toUp;
                    iniCameraQuadratorParams(prevIndex);

                    if (i === (cameraIndex - currParams.toLeft)) {

                        $scope.quadratorParams[prevIndex].hidden = false;
                        $scope.quadratorParams[prevIndex].replacer = currParams;
                        $scope.quadratorParams[prevIndex].parentItem = currParams;

                        currParams.hidden = true;
                    } else {
                        $scope.quadratorParams[prevIndex].hidden = true;
                        $scope.quadratorParams[prevIndex].parentItem = currParams;
                    }

                    currParams.childs.push({
                        value: currParams.toUp,
                        direction: 'up',
                        params: $scope.quadratorParams[prevIndex]
                    });

                    if (i !== cameraIndex) {
                        currParams.childs.push({
                            value: i > cameraIndex ? currParams.toRight : currParams.toLeft,
                            direction: i > cameraIndex ? 'right' : 'left',
                            params: $scope.quadratorParams[prevIndex]
                        });
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
                var topElement = getTopLeftCell(currParams);
                topElement.hidden = true;
                var currParamsRowNumber = Math.floor(cameraIndex / $scope.qudratorSize.num_cam_x.length);
                var topElementRowNumber = Math.floor(topElement.index / $scope.qudratorSize.num_cam_x.length);
                for (var h = 0; h < currParams.rows; h++) {
                    var prevIndex = topElement.index - 1 + h * $scope.qudratorSize.num_cam_x.length;
                    iniCameraQuadratorParams(prevIndex);
                    if (h === 0) {
                        $scope.quadratorParams[prevIndex].hidden = false;
                        $scope.quadratorParams[prevIndex].replacer = currParams;
                        $scope.quadratorParams[prevIndex].parentItem = currParams;

                        currParams.hidden = true;
                    } else {
                        $scope.quadratorParams[prevIndex].hidden = true;
                        $scope.quadratorParams[prevIndex].parentItem = currParams;
                    }

                    currParams.childs.push({
                        value: currParams.toLeft,
                        direction: 'left',
                        params: $scope.quadratorParams[prevIndex]
                    });

                    if (currParamsRowNumber !== topElementRowNumber + h) {
                        currParams.childs.push({
                            value: Math.abs(currParamsRowNumber - topElementRowNumber + h),
                            direction: currParamsRowNumber > topElementRowNumber + h ? 'up' : 'down',
                            params: $scope.quadratorParams[prevIndex]
                        });
                    }
                }

                break;
            case 'right':
                currParams.cols++;
                currParams.toRight++;

                var topElement = getTopLeftCell(currParams);
                var currParamsRowNumber = Math.floor(currParams.index / $scope.qudratorSize.num_cam_x.length);
                var topElementRowNumber = Math.floor(topElement.index / $scope.qudratorSize.num_cam_x.length);
                for (var h = 0; h < currParams.rows; h++) {
                    var nextIndex =
                        topElement.index + currParams.toRight + currParams.toLeft + h * $scope.qudratorSize.num_cam_x.length;
                    iniCameraQuadratorParams(nextIndex);
                    $scope.quadratorParams[nextIndex].hidden = true;
                    $scope.quadratorParams[nextIndex].parentItem = currParams;
                    currParams.childs.push({
                        value: currParams.toRight,
                        direction: 'right',
                        params: $scope.quadratorParams[nextIndex]
                    });


                    if (currParamsRowNumber !== topElementRowNumber + h) {
                        currParams.childs.push({
                            value: Math.abs(currParamsRowNumber - topElementRowNumber + h),
                            direction: currParamsRowNumber > topElementRowNumber + h ? 'up' : 'down',
                            params: $scope.quadratorParams[nextIndex]
                        });
                    }
                }
                break;
        }

        iniDisplayingSizeCamera($scope.quadratorParams[cameraIndex]);
        fixCamerasButtons();
    };

    $scope.cameraBackground = function (cameraIndex) {
        var params;
        if (cameraIndex < $scope.quadratorParams.length && (params = $scope.quadratorParams[cameraIndex]).camera.id)
            return 'background-image: url(//' + params.camera.serverModel.fact_address + ':8080/cam' + params.camera.id + '/thumb.jpg)';
        return 'background-image: none; background-color: black;';
    }

    var iniDisplayingSizeCamera = function (params) {
        params.width = 200 * Math.min(params.rows, params.cols);
    };

});

