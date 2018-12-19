
angular.module('app')
    .service('Windows', function ($timeout) {

        var body = angular.element('body:first');
        var mask = angular.element('<div></div>').addClass('windows-mask');



        var Windows = function(params) {
            var showWindow = function() {
                body.append(mask, notice).addClass('windows-body');
            };

            var hideWindow = function() {
                mask.detach();
                notice.detach().remove();
                body.removeClass('windows-body');
                angular.element(window).off('resize', moveToCenter);
            };

            this.show = showWindow;
            this.hide = hideWindow;

            var notice = angular.element('<div></div>').addClass('windows-notice');
            var buttons = [];
            params.buttons =
                params.buttons ||
                [
                    {
                        text: 'Ok',
                        style: 'btn-blue',
                        action: hideWindow
                    }
                ];
            var buttonsBlock = angular.element('<div>').addClass('windows-buttons');
            for (var i = 0; i < params.buttons.length; i++) {
                var btnParams = params.buttons[i];
                var btn = angular.element(
                    '<button class="btn ' + btnParams.style + '">' +
                        '<span class="btn-text">' + btnParams.text + '</span>' +
                    '</button>');
                btn.on('click', btnParams.action);
                buttonsBlock.append(btn)
            }
            var titleWindow = angular.element('<div>').text(params['title'] || 'Window').addClass('windows-title');
            var contentContainer = angular.element('<div>').text(params['text'] || 'Test message').addClass('windows-text');

            params['advanced'] ? contentContainer.append('<br/><br/>', params['advanced']) : false;

            if (params['field']) {
                var form = angular.element('<form>').attr('novalidate', true).on('submit', function(e) {
                    e.preventDefault();
                    params.confirmAction ? params.confirmAction() : false;
                });
                var inputContainer = angular.element('<label>').appendTo(form).addClass('field-container');
                if (params['field']['label']) {
                    var labelField = angular.element('<span>').addClass('field-label').appendTo(inputContainer).text(params['field']['label']);
                }
                var input = angular.element('<input>').val(params['field']['ngModel']).appendTo(inputContainer);
                params['field']['input'] = input;

                if (params['field']['required']) {
                    input.attr('required', true);
                    inputContainer.addClass('required');
                }
                form.appendTo(contentContainer);
            }

            var contentBlock = angular.element('<div>').append(titleWindow, contentContainer).addClass('windows-content');
            notice.append(contentBlock, buttonsBlock);
            showWindow(notice);

            var moveToCenter = function() {
                notice.css({
                    marginLeft: - notice.outerWidth() / 2,
                    marginTop: - notice.outerHeight() / 2
                });
            };
            angular.element(window).on('resize', moveToCenter);
            moveToCenter();

            var onMaskDown = function() {
                notice.css({
                    transform: 'scale(1.02)'
                });
                setTimeout(function() {
                    notice.css({
                        transform: ''
                    });
                }, 150);
            };

            mask.on({'mousedown': onMaskDown});
            notice.addClass('on-visible');
        };

        return {
            alert: function(params) {
                var notice = new Windows({
                    buttons: [
                        {
                            text: 'Ok',
                            style: 'btn-blue',
                            action: function() {
                                notice.hide();
                                $timeout(function () {
                                    params['onClose'] ? params['onClose']() : false;
                                });
                            }
                        }
                    ],
                    title: params['title'] || 'Confirm the action',
                    text: params['text'] || 'Confirm the action'
                });
            },
            confirm: function(params) {
                var notice = new Windows({
                    buttons: [
                        {
                            text: params['confirmText'] || 'Confirm',
                            style: 'btn-blue',
                            action: function() {
                                notice.hide();
                                $timeout(function () {
                                    params['onConfirm'] ? params['onConfirm']() : false;
                                });
                            }
                        }, {
                            text: params['cancelText'] || 'Cancel',
                            style: 'btn-red',
                            action: function() {
                                notice.hide();
                                $timeout(function () {
                                    params['onClose'] ? params['onClose']() : false;
                                });
                            }
                        }
                    ],
                    title: params['title'] || 'Confirm the action',
                    text: params['text'] || 'Confirm the action'
                });
            },
            prompt: function(params) {
                var confirmParams = {
                    text: params['confirmText'] || 'Send',
                    style: 'btn-blue',
                    action: function () {
                        var isValidate = params['onConfirm'](params['field'], notice.hide);

                        if (!isValidate && isValidate === undefined) {
                            notice.hide();
                        }
                    }
                };
                var notice = new Windows({
                    buttons: [
                        confirmParams, {
                            text: params['cancelText'] || 'Cancel',
                            style: 'btn-red',
                            action: function () {
                                notice.hide();
                                params['onClose'] ? params['onClose']() : false;
                            }
                        }
                    ],
                    confirmAction: confirmParams.action,
                    title: params['title'] || 'Confirm the action',
                    text: params['text'] || 'Confirm the action',
                    advanced: params['advanced'],
                    field: params['field']
                });
            }
        };
    }).service('Notice', function () {
        var body = angular.element('body:first');

        var noticeContainer = angular.element('<div>').addClass('request-notice').appendTo(body);
        var noticeContentHolder = angular.element('<div>').addClass('request-notice-content').appendTo(noticeContainer);
        var noticeIcon = angular.element('<i>').addClass('fa').appendTo(noticeContentHolder);
        var noticeTextContentHolder = angular.element('<div>').addClass('request-notice-text-content').appendTo(noticeContentHolder);
        var noticeTitle = angular.element('<div>').addClass('request-notice-title').appendTo(noticeTextContentHolder);
        var noticeText = angular.element('<div>').addClass('request-notice-text').appendTo(noticeTextContentHolder);

        var oldIcon = false;

        var hideCallbackTimer = function () {
            noticeContainer.removeClass('showed-notice');
        };
        var hideTimer = false;

        return {
            'show': function (params) {
                if (!params) return;
                hideTimer ? clearTimeout(hideTimer) : false;
                noticeText.text(params.message || '');
                noticeTitle.text(params.code || '');
                if (oldIcon != params.icon) {
                    if (oldIcon) {
                        noticeIcon.removeClass(oldIcon);
                    }
                    if (params.icon) {
                        noticeIcon.addClass(params.icon);
                    }
                    oldIcon = params.icon;
                }
                noticeContainer.addClass('showed-notice');
                hideTimer = setTimeout(hideCallbackTimer, 5000);
            }
        };
    });


