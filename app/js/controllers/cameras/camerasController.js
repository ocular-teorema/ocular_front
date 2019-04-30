var module = angular.module('app');
module.controller('camerasController', function ($scope, Windows, CamerasService, selectedOrganization, camerasList) {
  $scope.cameras = angular.copy(camerasList.data);
  $scope.organizationId = selectedOrganization;

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

  $scope.importCameras = ({files: files}) => {
    fetch(window.URL.createObjectURL(files[0]))
      .then(res => res.text())
      .then(csv => {
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        const result = [];

        for (let i = 1; i < lines.length; i++) {
          const obj = {};
          const currentline = lines[i].split(',');

          for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
          }

          result.push(obj);
        };

        console.log(result)
      });
  }
})