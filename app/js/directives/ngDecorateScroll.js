var module = angular.module('Directives');
module.directive('ngDecorateScroll', function($timeout) {

    var scrollTestDiv = angular.element('<div>').css({overflow: 'scroll'});
    var noScrolled = angular.element('<div>').appendTo(scrollTestDiv);
    angular.element('body').append(scrollTestDiv);
    var scrollSize = scrollTestDiv.width() - noScrolled.width();
    scrollTestDiv.detach().remove();

    return {
        'restrict': 'A',
        'scope': {
            ngDecorateScroll: '=?ngDecorateScroll'
        },
        'link': function ($scope, element) {
            element.css({
                marginRight: -scrollSize,
                marginBottom: -scrollSize
            });
        }
    }
});