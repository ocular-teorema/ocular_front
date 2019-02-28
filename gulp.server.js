var gulp = require('gulp');
var path = require('path');
var browserSync = require('browser-sync');
var url = require('url');
var proxyMiddleware = require('http-proxy-middleware');

var allowedExtensions = ['html', 'js', 'map', 'css', 'png', 'svg', 'jpg', 'jpeg', 'gif', 'webp', 'woff', 'ttf', 'svg', 'otf', 'ico', 'eot', 'swf', 'mp3'];

var extensionsPattern = allowedExtensions.map(function (extension) {
    return '\\.' + extension;
}).join('|');

var indexTemplates = ['login'].join('|');

// var proxyURL = 'http://80.254.48.93';
var proxyURL = 'http://78.46.97.176';
var socketURL = 'ws://78.46.97.176';
// var socketURL = 'ws://80.254.48.93';


var devServerApi = {
    path: [
        "/api", "/accounts", "/logout/", "/user_cameras/", "/videoanalytic", "/vasrc", "/vascaled"
    ],
//    url: url.parse("http://78.46.97.176/")
//    url: url.parse("http://80.254.48.255:60080/")
//     url: url.parse("http://80.254.48.93")
    url: url.parse(proxyURL)
    // url: url.parse("http://192.168.10.105")
};

var getBrowserSyncConfig = function () {

    var modRewrite = require('connect-modrewrite');
    // var proxyOptions = url.parse('http://examination.ddgcorp.ru/api');
    // proxyOptions.route = '/api';
    // proxyOptions.changeOrigin = true;
    // proxyOptions.path = ["/api", "/api-auth"];
    // proxyOptions.auth = 'wer@wer:123456';
    
    var proxyTable = {
        "/videoanalytic" : proxyURL + ":8080",
        "/vasrc" : proxyURL + ":8080",
        "/vascaled" : proxyURL + ":8080"
    };
    
    var proxy = proxyMiddleware(devServerApi.path, {
        target: devServerApi.url,
        changeOrigin: true,
        cookieDomainRewrite: '*',
        ws: false,
        // auth: devServerApi.auth,
        // auth: 'superuser:superuser123',
        router: proxyTable,
        logLevel: 'debug'
    });

    return {
        development: {
            server: {
                //baseDir: [paths.build.root]
            },
            port: 9999,
            https: false,
            files: [
                //path.join(paths.build.root, "**/*")
            ],
            middleware: [
                proxy,
                modRewrite([
                    '^.*/(' + indexTemplates + ')$ /$1.html',
                    '!' + extensionsPattern + ' /index.html [L]'
                ])
            ],
            ghostMode: false,
            injectChanges: false,
            open: false
        }
    }
};

gulp.task('serve', function () {
    var bsConfig = getBrowserSyncConfig();
    var c = bsConfig.development;
    c.server.baseDir = 'dist';
    c.files = [path.join('dist', "*.html")];
    browserSync(c);

    // gulp.watch("dist/*.html").on('change', browserSync.reload);
});

