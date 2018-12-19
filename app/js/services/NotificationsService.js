var module = angular.module('Services');
module.service('NotificationsService', function(RequestService, API) {
  return {
    getList: function(organizationId) {
      var params = {
        url: API.NOTIFICATIONS.PATH,
        params: {
          params: {
            organization: organizationId || undefined
          }
        }
      };
      return RequestService.get(params);
    },
    getNotification: function(id) {
      var params = {
        url: API.NOTIFICATIONS.PATH + id + '/'
      };
      return RequestService.get(params);
    },
    saveNotification: function(data) {
      var params = {
        data: data,
        url: API.NOTIFICATIONS.PATH + (data.id ? data.id + '/' : ''),
        method: data.id ? 'PUT' : false
      };
      return RequestService.post(params);
    },
    deleteNotification: function(userId) {
      var params = {
        url: API.NOTIFICATIONS.PATH + userId + '/',
        method: 'DELETE'
      };
      return RequestService.post(params);
    }
  };
});
