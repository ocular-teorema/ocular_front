var module = angular.module('Constants');
module.constant('NotificationType',
  {
    'AREA': 'Движение в зоне',
    'STATIC_OBJECT': 'Оставленный предмет',
    'VELOCITY': 'Скорость движения',
    'INVALID_MOTION': 'Вектор движение',
    'CALIBRATION_ERROR': 'Ошибка калибровки',
    'PEOPLE_COUNT': 'Толпа',
  }
);
