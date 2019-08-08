'use strict';
var module = angular.module('app');
module.config(function ($stateProvider, $locationProvider, $urlRouterProvider) {
    var templatesPath = '/static/templates/';
    $urlRouterProvider.otherwise(function($injector) {
        $injector.invoke(function($state) {
            $state.transitionTo("main.base.stream", {}, false);
        });
    });
    $stateProvider
        .state('main', {
            abstract: true,
            template: "<div ui-view class='main-wrapper-section'></div>",
            onEnter: function ($rootScope, $window) {
                $rootScope.TEOREMA_TYPE = $window.TEOREMA_TYPE;
            },
            resolve: {
                currentUser: function (UsersService, $state, $q) {
                    var defer = $q.defer();
                    UsersService.getCurrent().then(
                        function (response) {
                            defer.resolve(response);
                        },
                        function () {
                            defer.resolve(false);
                        }
                    );
                    return defer.promise;
                },
                userCameras: function (CamerasService, $q, currentUser, $state) {
                    if (!currentUser) {
                        $state.go('login');
                        return;
                    }
                    var defer = $q.defer();
                    CamerasService.getUserCamerasList().then(
                        function (response) {
                            defer.resolve(response);
                        },
                        function () {
                            defer.resolve(false);
                        }
                    );
                    return defer.promise;
                }
            },
            controller: 'mainController'
        })
        .state('login', {
            controller: function () {
                window.location.href = '/login';
            }
        })
        .state('main.base', {
            abstract: true,
            controller: 'baseController',
            templateUrl: templatesPath + 'common/base.html'
        })
        .state('main.base.stream', {
            url: '/',
            templateUrl: templatesPath + 'pages/stream.html',
            controller: 'streamController',
            resolve: {
                camerasQuadrators: function (QuadratorsService) {
                    return QuadratorsService.getList();
                },
                camerasList: function (CamerasService) {
                    return CamerasService.getList();
                }
            }
        })
        .state('main.base.records', {
            url: '/records',
            templateUrl: templatesPath + 'pages/records.html',
            controller: 'recordsController',
            userCameras: function (CamerasService, $q, currentUser, $state) {
                if (!currentUser) {
                    $state.go('login');
                    return;
                }
                var defer = $q.defer();
                CamerasService.getUserCamerasList().then(
                    function (response) {
                        defer.resolve(response);
                    },
                    function () {
                        defer.resolve(false);
                    }
                );
                return defer.promise;
            }
        })
        .state('main.base.recordsPlayer', {
            url: '/records/player?:post&:filters&:speed',
            templateUrl: templatesPath + 'pages/records/player.html',
            controller: 'recordsPlayerController'
        })
        .state('main.base.settings', {
            url: '/settings',
            templateUrl: templatesPath + 'pages/settings.html',
            controller: 'settingsController'
        })
        .state('logout', {
            url: '/logout',
            controller: function (UsersService, $state) {
                UsersService.logOut().then(function () {
                    $state.go('login');
                });
            }
        })
        .state('main.administration', {
            url: '/administration',
            abstract: true,
            templateUrl: templatesPath + 'common/admin.html',
            resolve: {
                organizationsList: function (OrganizationsService) {
                    return OrganizationsService.getList();
                }
            }
        })
        .state('main.administration.base', {
            url: '',
            parent: 'main.administration',
            onEnter: function ($state, currentUser, $rootScope) {
                if ((currentUser.data.is_staff || currentUser.data.is_organization_admin) &&
                    $rootScope.TEOREMA_TYPE !== 'company') {
                    $state.go('main.administration.profile');
                } else {
                    $state.go('main.base.stream');
                }
            }
        })
        .state('main.administration.profile', {
            url: '/profile',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/profile.html',
            controller: 'profileController'
        })
        .state('main.administration.users', {
            abstract: true,
            template: '<div ui-view></div>'
        })
        .state('main.administration.users.list', {
            url: '/users/:organizationId?',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/users/users.html',
            controller: 'usersController',
            resolve: {
                usersList: function (UsersService, currentUser) {
                    return UsersService.getList(currentUser.data.organization);
                },
                selectedOrganization: function (currentUser, $stateParams) {
                    return currentUser.data.organization
                },
            }
        })
        .state('main.administration.users.edit', {
            url: '/users/:organizationId/edit/:userId?',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/users/users-edit.html',
            controller: 'usersEditController',
            resolve: {
                selectedUser: function (UsersService, $stateParams) {
                    if ($stateParams.userId) {
                        return UsersService.getUser($stateParams.userId);
                    } else {
                        return false;
                    }
                },
                cameraGroupsList: function (CameraGroupsService, $stateParams) {
                    return CameraGroupsService.getList($stateParams.organizationId);
                },
                camerasList: function (CamerasService, $stateParams) {
                    return CamerasService.getList($stateParams.organizationId);
                },
                quadratorsList: function (QuadratorsService) {
                    return QuadratorsService.getList();
                }
            }
        })
        .state('main.administration.users.create', {
            url: '/users/:organizationId/create',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/users/users-edit.html',
            controller: 'usersEditController',
            data: {
                isNewUser: true
            },
            resolve: {
                selectedUser: function () {
                    return false;
                },
                cameraGroupsList: function (CameraGroupsService, $stateParams) {
                    return CameraGroupsService.getList($stateParams.organizationId);
                },
                camerasList: function (CamerasService, $stateParams) {
                    return CamerasService.getList($stateParams.organizationId);
                },
                quadratorsList: function (QuadratorsService) {
                    return QuadratorsService.getList();
                }
            }
        })
        .state('main.administration.quadrators', {
            abstract: true,
            template: '<div ui-view></div>'
        })
        .state('main.administration.quadrators.list', {
            url: '/quadrators',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/quadrators/quadrators.html',
            controller: 'quadratorsController',
            resolve: {
                quadratorsList: function (QuadratorsService) {
                    return QuadratorsService.getList();
                }
            }
        })
        .state('main.administration.quadrators.edit', {
            url: '/quadrators/edit/:quadratorId?',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/quadrators/quadrators-edit.html',
            controller: 'quadratorsEditController',
            resolve: {
                selectedQuadrator: function(QuadratorsService, $stateParams) {
                    if ($stateParams.quadratorId) {
                        return QuadratorsService.getQuadrator($stateParams.quadratorId);
                    } else {
                        return false;
                    }
                },
                camerasList: function (CamerasService, $stateParams) {
                    return CamerasService.getList();
                },
                serversList: function(ServersService, $stateParams) {
                    return ServersService.getList($stateParams.organizationId);
                }
            }
        })

        .state('main.administration.cameras', {
            abstract: true,
            template: '<div ui-view></div>'
        })
        .state('main.administration.cameras.list', {
            url: '/cameras/:organizationId?',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/cameras/cameras.html',
            controller: 'camerasController',
            resolve: {
                selectedOrganization: function (currentUser, $stateParams) {
                    return currentUser.data.organization
                },
                camerasList: function (CamerasService, selectedOrganization) {
                    var organizationId = selectedOrganization ? selectedOrganization.id : false;
                    return CamerasService.getList(organizationId);
                }
            }
        })
        .state('main.administration.cameras.edit', {
            url: '/cameras/:organizationId/edit/:cameraId?',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/cameras/cameras-edit.html',
            controller: 'camerasEditController',
            resolve: {
                selectedCamera: function(CamerasService, $stateParams) {
                    if ($stateParams.cameraId) {
                        return CamerasService.getCamera($stateParams.cameraId);
                    }
                },
                serversList: function(ServersService, $stateParams) {
                    return ServersService.getList($stateParams.organizationId);
                },
                cameraGroupsList: function(CameraGroupsService, $stateParams) {
                    return CameraGroupsService.getList($stateParams.organizationId);
                }
            }
        })
        .state('main.administration.cameras.create', {
            url: '/cameras/:organizationId/create',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/cameras/cameras-edit.html',
            controller: 'camerasEditController',
            data: {
                isNewCamera: true
            },
            resolve: {
                selectedCamera: function() {
                    return false
                },
                serversList: function(ServersService, $stateParams) {
                    return ServersService.getList($stateParams.organizationId);
                },
                cameraGroupsList: function(CameraGroupsService, $stateParams) {
                    return CameraGroupsService.getList($stateParams.organizationId);
                }
            }
        })
        .state('main.administration.notifications', {
            abstract: true,
            template: '<div ui-view></div>'
        })
        .state('main.administration.notifications.list', {
            url: '/notifications/:organizationId?',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/notifications/notifications.html',
            controller: 'notificationsController',
            resolve: {
                usersList: function (UsersService, currentUser) {
                    return UsersService.getList(currentUser.data.organization);
                },
                camerasList: function(CamerasService, selectedOrganization) {
                    var organizationId = selectedOrganization ? selectedOrganization.id : false;
                    return CamerasService.getList(organizationId);
                },
                cameraGroupsList: function(CameraGroupsService, $stateParams) {
                    return CameraGroupsService.getList($stateParams.organizationId);
                },
                selectedOrganization: function (currentUser) {
                    return currentUser.data.organization
                },
                notificationsList: function (NotificationsService, selectedOrganization) {
                    var organizationId = selectedOrganization ? selectedOrganization.id : false;
                    return NotificationsService.getList(organizationId);
                }
            }
        })
        .state('main.administration.notifications.edit', {
            url: '/notifications/:organizationId/edit/:notificationId?',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/notifications/notifications-edit.html',
            controller: 'notificationsEditController',
            resolve: {
                selectedOrganization: function (currentUser) {
                    return currentUser.data.organization
                },
                selectedNotification: function(NotificationsService, $stateParams) {
                    if ($stateParams.notificationId) {
                        return NotificationsService.getNotification($stateParams.notificationId);
                    }
                },
                cameraGroupsList: function(CameraGroupsService, $stateParams) {
                    return CameraGroupsService.getList($stateParams.organizationId);
                },
                usersList: function (UsersService, currentUser) {
                    return UsersService.getList(currentUser.data.organization);
                },
                camerasList: function(CamerasService, selectedOrganization) {
                    var organizationId = selectedOrganization ? selectedOrganization.id : false;
                    return CamerasService.getList(organizationId);
                },
            }
        })
        .state('main.administration.notifications.create', {
            url: '/notifications/:organizationId/create',
            parent: 'main.administration',
            templateUrl: templatesPath + 'pages/administration/notifications/notifications-edit.html',
            controller: 'notificationsEditController',
            data: {
                isNewNotification: true
            },
            resolve: {
                usersList: function (UsersService, currentUser) {
                    return UsersService.getList(currentUser.data.organization);
                },
                selectedOrganization: function (currentUser) {
                    return currentUser.data.organization
                },
                selectedNotification: function() {
                    return false
                },
                cameraGroupsList: function(CameraGroupsService, $stateParams) {
                    return CameraGroupsService.getList($stateParams.organizationId);
                },
                camerasList: function(CamerasService, selectedOrganization) {
                    var organizationId = selectedOrganization ? selectedOrganization.id : false;
                    return CamerasService.getList(organizationId);
                },
            }
        })
        .state('main.adminsettings', {
            url: '/adminsettings',
            abstract: true,
            templateUrl: templatesPath + 'common/admin.html'
        })
        .state('main.adminsettings.base', {
            url: '',
            parent: 'main.adminsettings',
            onEnter: function ($state, currentUser) {
                if (currentUser.data.is_staff) {
                    $state.go('main.adminsettings.profile');
                } else {
                    $state.go('main.base.stream');
                }
            }
        })
        .state('main.adminsettings.profile', {
            url: '/profile',
            parent: 'main.adminsettings',
            templateUrl: templatesPath + 'pages/administration/profile.html',
            controller: 'profileController',
            data: {
                isAdminProfile: true
            }
        })
        .state('main.adminsettings.servers', {
            abstract: true,
            template: '<div ui-view></div>'
        })
        .state('main.adminsettings.servers.list', {
            url: '/servers',
            parent: 'main.adminsettings',
            templateUrl: templatesPath + 'pages/adminsettings/servers/servers.html',
            controller: 'serversController',
            resolve: {
                serversList: function(ServersService) {
                    return ServersService.getList();
                }
            }
        })
        .state('main.adminsettings.servers.edit', {
            url: '/servers/edit/:serverId',
            parent: 'main.adminsettings',
            templateUrl: templatesPath + 'pages/adminsettings/servers/servers-edit.html',
            controller: 'serversEditController',
            resolve: {
                organizationsList: function (OrganizationsService) {
                    return OrganizationsService.getList();
                },
                server: function (ServersService, $stateParams) {
                    return ServersService.getServer($stateParams.serverId)
                },
                serversList: function(ServersService, $stateParams) {
                    return ServersService.getList($stateParams.organizationId);
                },
            }
        })
        .state('main.adminsettings.servers.create', {
            url: '/servers/create',
            parent: 'main.adminsettings',
            templateUrl: templatesPath + 'pages/adminsettings/servers/servers-edit.html',
            controller: 'serversEditController',
            resolve: {
                organizationsList: function (OrganizationsService) {
                    return OrganizationsService.getList();
                },
                serversList: function(ServersService, $stateParams) {
                    return ServersService.getList($stateParams.organizationId);
                },
                server: function () {
                    return false;
                }
            }
        })
        .state('main.adminsettings.organizations', {
            abstract: true,
            template: '<div ui-view></div>'
        })
        .state('main.adminsettings.organizations.list', {
            url: '/organizations',
            parent: 'main.adminsettings',
            templateUrl: templatesPath + 'pages/adminsettings/organizations/organizations.html',
            controller: 'organizationsController',
            resolve: {
                organizationsList: function (OrganizationsService) {
                    return OrganizationsService.getList();
                }
            }
        })
        .state('main.adminsettings.organizations.edit', {
            url: '/servers/organizations/edit/:organizationId',
            parent: 'main.adminsettings',
            templateUrl: templatesPath + 'pages/adminsettings/organizations/organizations-edit.html',
            controller: 'organizationsEditController',
            resolve: {
                organization: function (OrganizationsService, $stateParams) {
                    return OrganizationsService.getList($stateParams.organizationId)
                },
                serversList: function(ServersService) {
                    return ServersService.getList();
                }
            }
        })
        .state('main.adminsettings.organizations.create', {
            url: '/organizations/create',
            parent: 'main.adminsettings',
            templateUrl: templatesPath + 'pages/adminsettings/organizations/organizations-edit.html',
            controller: 'organizationsEditController',
            resolve: {
                organization: function () {
                    return false
                },
                serversList: function(ServersService) {
                    return ServersService.getList();
                }
            }
        })
        .state('activeCamera', {
            url: '/active-camera',
            templateUrl: templatesPath + 'pages/active-camera.html',
            controller: 'activeCameraController',
            resolve: {
                camerasList: function (CamerasService) {
                    return CamerasService.getList();
                }
            }
        })
});
