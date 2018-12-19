var module = angular.module('Directives');
module.directive('ngDatePicker', function() {
    angular.element.datepicker.setDefaults({
        dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'ПТ', 'Сб'],
        dateFormat: 'dd.mm.yy D'
    });
    return {
        'restrict': 'A',
        'scope': {
            ngDatePicker: '=',
            ngModel: '='
        },
        'controller': function ($scope) {

        },
        'link': function ($scope, element) {
            element.datepicker($scope.ngDatePicker);

            element.parent().on('click', function() {
                element.datepicker('show');
            });
            $scope.$watch('ngModel', function() {
                if ($scope.ngModel) {
                    $scope.ngDatePicker.noFormattedDate = element.datepicker('getDate');
                }
            });
            $scope.$watch('ngDatePicker.maxDate', function() {
                element.datepicker('option', 'maxDate', $scope.ngDatePicker.maxDate);
            });

            $scope.$watch('ngDatePicker.minDate', function() {
                element.datepicker('option', 'minDate', $scope.ngDatePicker.minDate);
            });
            element.datepicker( "widget" ).addClass('popup-window city-shop-filter');
            $scope.$on('$destroy', function() {
                element.datepicker ? element.datepicker("hide") : false;
                element.datepicker ? element.datepicker( "widget" ).empty().remove() : false;
            });
        }
    }
});
