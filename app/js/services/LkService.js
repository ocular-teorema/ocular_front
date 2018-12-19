var module = angular.module('Services');
module.service('LkService', function(RequestService, API) {
  return {
    checkUser: function() {
      var params = {
        url: API.LK.CHECK
      };
      return RequestService.get(params);
    },
    updateUser: function() {
      var params = {
        url: API.LK.UPDATE
      };
      return RequestService.get(params);
    },
    addCameras: function(data, id) {
      var params = {
        url: API.LK.CHECK + id + '/',
        data: data,
        method: 'PATCH'
      };
      return RequestService.post(params);
    },
    payOffline: function(data) {
      var params = {
        url: API.LK.OFFLINE,
        data: {code: data},
        method: 'POST'
      };
      return RequestService.post(params);
    },
    checkHash: function() {
      var params = {
        url: API.LK.TODAY_HASH
      };
      return RequestService.get(params);
    }
  };
});
