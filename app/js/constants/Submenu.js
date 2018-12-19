var module = angular.module('Constants');
module.constant('Submenu', [
    {
        "ROUTE": "main.administration.profile",
        "TITLE": "Профиль"
    },
    {
        "ROUTE": "main.administration.cameras.list",
        "TITLE": "Камеры",
        "is_organization_admin": true
    },
    {
        "ROUTE": "main.administration.quadrators.list",
        "TITLE": "Квадраторы",
        "is_organization_admin": true
    },
    {
        "ROUTE": "main.administration.users.list",
        "TITLE": "Пользователи"
    },
    {
        "ROUTE": "main.administration.notifications.list",
        "TITLE": "Уведомления"
    }
]);
