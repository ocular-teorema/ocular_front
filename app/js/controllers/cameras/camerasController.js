var module = angular.module('app');
module.controller('camerasController', function ($scope, Windows, CamerasService, selectedOrganization, camerasList, CameraGroupsService) {
  $scope.cameras = angular.copy(camerasList.data);
  $scope.organizationId = selectedOrganization;
  $scope.isUploading = false;

  $scope.tableTitles = [
    {
      key: "group",
      name: 'группа камер'
    },
    {
      key: "name",
      name: 'имя камеры'
    },
    {
      key: "storage_life",
      name: 'срок хранения (дней)'
    },
    {
      key: "analysis",
      name: 'анализ'
    },
    // {
    //   key: "price",
    //   name: 'стоимость в месяц'
    // },
    // {
    //   key: "date",
    //   name: 'оплачена по'
    // }
  ]

  $scope.analiseTypesList = {
    1: 'Только запись',
    2: 'Только движение',
    3: 'Полный анализ'
  };

  $scope.sortCameras = function (key) {
    if (key === 'group') {
      $scope.cameras = _.sortBy($scope.cameras, [function (o) { return o.camera_group.name }])
    } else {
      $scope.cameras = _.sortBy($scope.cameras, [function (o) { return o[key] }])
    }
    $scope.sortField = key;
  }

  $scope.sortCameras('group')

  $scope.deleteCamera = function (camera) {
    Windows.confirm({
      confirmText: 'Да, удалить',
      onConfirm: function () {
        CamerasService.deleteCamera(camera.id).then(function () {
          $scope.cameras = $scope.cameras.filter(function (cam) {
            return cam !== camera;
          });
        });
      },
      cancelText: 'Отменить',
      title: 'Удаление камеру из базы',
      text: 'Вы действительно хотите удалить камеру "' + camera.name + '"?'
    });
  };

  $scope.exportCameras = () => {
    const header = ['id', 'name', 'camera_group', 'server', 'address', 'archive_path', 'storage_life', 'analysis'];
    const replacer = value => value === null ? '' : value;
    let csv = $scope.cameras.map(row => {
      return header.map(fieldName => {
        return JSON.stringify(
          fieldName === 'camera_group' ? row[fieldName].name : row[fieldName],
          replacer()
        );
      }).join(',');
    });

    csv.unshift(header.join(','));
    csv = csv.join('\r\n');
    $scope.downloadCameras(csv);
  }

  $scope.downloadCameras = csv => {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';

    const blob = new Blob([csv], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = 'camerasList.csv';
    a.click();

    window.URL.revokeObjectURL(url);
  }

  $scope.triggerUploadInput = () => {
    angular.element('#uploadFile').trigger('click');
  }

  $scope.convertCsvToObject = async file => {
    const res = await fetch(window.URL.createObjectURL(file));
    const csv = await res.text();
    const arr = csv.split('\n');
    if (!arr[arr.length - 1].length) arr.pop();
    const cameras = [];
    const headers = arr[0].split(',');

    for (let i = 1; i < arr.length; i++) {
      const data = arr[i].split(',');
      const obj = {};

      for (let j = 0; j < data.length; j++) {
        obj[headers[j].trim()] = data[j].trim().replace(/['"]+/g, '');
      }

      cameras.push(obj);
    }

    return cameras;
  }

  $scope.uploadCameras = ({files: files}) => {
    $scope.convertCsvToObject(files[0])
      .then(data => {
        let payload = data;
        const promises = [];
        
        CameraGroupsService['getList']()
          .then(res => {
            payload.forEach(camera => {
              $scope.isUploading = true;
              camera.organization = selectedOrganization;
              camera.indefinitely = false;
              camera.compress_level = 1;
              camera.camera_group = res.data.filter(group => {
                return group.name === camera.camera_group
              })[0].id;

              if (
                $scope.cameras
                  .findIndex(uploadedCamera => uploadedCamera.id == camera.id) === -1
              ) {
                promises.push(CamerasService['createCamera'](camera));
              } else {
                promises.push(CamerasService['updateCamera'](camera));
              }
            });

            Promise.all(promises)
              .then(() => {
                $scope.$apply(() => {
                  $scope.isUploading = false;
                });
              });
          });
      });
  }
});
