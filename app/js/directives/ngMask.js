'use strict';
var module = angular.module('Directives');
module.directive('ngMask', function() {
    return {
        'restrict': 'A',
        'scope': {
            ngMask: '='
        },
        'controller': function ($scope) {},
        'link': function ($scope, element) {
            element.inputmask($scope.ngMask);
        }
    }
});
