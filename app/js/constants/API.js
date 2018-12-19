var module = angular.module('Constants');
module.constant('API', {
    "PATH": "/api/",
    "AUTH": {
        "PATH": "rest-auth/",
        "LOGIN": "login/",
        "LOGOUT": "logout/"
    },
    "ACCOUNTS": {
        "PATH": "/accounts/",
        "PROFILE": "profile/"
    },
    "USERS": {
        "PATH": "users/"
    },
    "ORGANIZATIONS": {
        "PATH": "organizations/"
    },
    "CAMERAS": {
        "PATH": "cameras/"
    },
    "QUADRATORS": {
        "PATH": "quadrator/"
    },
    "SERVERS": {
        "PATH": "servers/"
    },
    "NOTIFICATIONS": {
        "PATH": "notifications/"
    },
    "CAMERA_GROUPS": {
        "PATH": "camera_groups/"
    },
    "USER_CAMERAS": {
        "PATH": "/user_cameras/"
    },
    "CAMSETS": {
        "PATH": "camsets/"
    },
    "SECURITY_PATH": '/signal',
    "LK": {
      "CHECK": "ocularuser/",
      "UPDATE": "update_ocularuser_info/",
      "OFFLINE": "offline_pay/",
      "TODAY_HASH": "today_hash/"
    }
});