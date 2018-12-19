var module = angular.module('Directives');
module.directive('ngPanZoom', function() {
    return {
        'restrict': 'A',
        'scope': {
            ngPanZoom: '='
        },
        'link': function ($scope, element) {


            var $panzoom = element.panzoom({
                minScale: 0.1,
                maxScale: 1
            });
            $panzoom.parent().on('mousewheel.focal', function( e ) {
                e.preventDefault();
                var delta = e.delta || e.originalEvent.wheelDelta;
                var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;

                var percentZoom = (percentSize - 100) / 200;
                e.clientX = e.clientX + percentZoom * angular.element(this).width();
                e.clientY = e.clientY + percentZoom * angular.element(this).height();

                $panzoom.panzoom('zoom', zoomOut, {
                    increment: 0.1,
                    animate: false,
                    focal: e,
                    contain: 'invert',
                    panOnlyWhenZoomed: true,
                    relative: true,
                    transition: true,
                    silent: true
                });
            });


            var onZoom = function(event, instance, matrix) {
                var normalScale = 100 / percentSize;
                var currentScale = matrix[0];

                var currentPercentSize = currentScale / normalScale;
                var forRangeX = (element.parent().width() * currentPercentSize - element.parent().width()) / 2;
                var forRangeY = (element.parent().height() * currentPercentSize - element.parent().height()) / 2;

                $panzoom.off('panzoomchange', onZoom);
                element.panzoom("setMatrix",[
                    matrix[0],
                    matrix[1],
                    matrix[2],
                    matrix[3],
                    Math.max(-forRangeX, Math.min(matrix[4], forRangeX)),
                    Math.max(-forRangeY, Math.min(matrix[5], forRangeY))
                ], {
                    silent: true
                });
                $panzoom.on('panzoomchange', onZoom);
            };

            var width = $scope.ngPanZoom.mode > 2 ? 800 : 1920;

            var percentSize;
            setTimeout(function() {
                percentSize = width / (element.width() / 100);

                element.css({
                    width: percentSize + '%',
                    height: percentSize + '%',
                    position: 'relative',
                    left: -(percentSize - 100) / 2 + '%',
                    top: -(percentSize - 100) / 2 + '%'
                });
                $panzoom.panzoom("option", "minScale", 100 / percentSize);
                $panzoom.panzoom("setMatrix", [ 100 / percentSize, 0, 0, 100 / percentSize, 0, 0 ]);
                $panzoom.on('panzoomchange', onZoom);
            }, 100);

        }
    }
});
