var module = angular.module('Constants');
module.constant('Menu', [
    {
        "ROUTE": "main.base.stream",
        "TITLE": "Охрана"
    },
    {
        "ROUTE": "main.base.records",
        "TITLE": "Архив"
    },
    {
        "ROUTE": "main.administration.base",
        "TITLE": "Управление",
        'isAdminMenu': true
    },
    {
        "ROUTE": "main.adminsettings.base",
        "TITLE": "Администрирование",
        'isAdminSettingsMenu': true
    }
]);