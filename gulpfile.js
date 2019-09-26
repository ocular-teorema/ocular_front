require('./gulp.server.js');
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    path = require('path'),
    concat = require('gulp-concat'),
    uglifyjs = require('gulp-uglifyjs'),
    runSequence = require('run-sequence'),
    uglifycss = require('gulp-uglifycss'),
    rev = require('gulp-rev'),
    del = require('del'),
    ngConfig = require('gulp-ng-config'),
    browserify = require('gulp-browserify'),
    argv = require('yargs').argv,
    rename = require('gulp-rename'),
    // autoprefixer = require('gulp-autoprefixer'),
    revReplace = require("gulp-rev-replace"),
    htmlreplace = require("gulp-html-replace"),
    merge = require('merge-stream');


var project = argv['project'] || 'teorema';

var fs = require('fs'),
    config = require('./config.js');

var output = 'app';
var input = 'dist';
var isProduction;

var folders = {
    'ts': 'ts',
    'js': 'js',
    'scss': 'scss',
    'fonts': 'fonts',
    'favicon': 'favicon',
    'css': 'css',
    'npm': './node_modules',
    'templates': 'templates',
    'media': 'media',
    'images': 'images',
    'static': 'static',
    'bower': 'bower_components',
    'i18n': 'i18n'
};

var titles = {
    'stalt': 'stalt-video'
};

//
/* Favicon */
gulp.task('app:favicon', function() {
    return gulp.src(path.join(output, folders['favicon'], project, '**/*'))
        .pipe(gulp.dest(path.join(input, 'static', folders['favicon'])));
});
//
//

/* Project images */
gulp.task('app:project-images', function() {
    return gulp.src([
        path.join(output, 'project-images', project, '**/*')
    ])
        .pipe(gulp.dest(path.join(input, 'static', folders['images'], 'project')));
});

/* Styles images collection */
gulp.task('app:images', ['app:project-images'], function() {
    return gulp.src([
        path.join(output, folders['images'], '**/*')
    ])
        .pipe(gulp.dest(path.join(input, 'static', folders['images'])));
});

/* Fonts collection */
gulp.task('app:fonts', function() {
    var libFonts = gulp.src(path.join(folders['npm'], 'bootstrap', 'fonts', '*'))
	.pipe(gulp.dest(path.join(input, 'static', 'fonts')));
    var cssFonts = gulp.src(path.join(output, folders['scss'], 'fonts', '**/*'))
	.pipe(gulp.dest(path.join(input, 'static', folders['css'], folders['fonts'])));
    return merge(libFonts, cssFonts);
});
//
/* Media collection */
gulp.task('app:media', function () {
    return gulp.src(path.join(output, folders['media'], '**/*'))
        .pipe(gulp.dest(path.join(input, folders['static'], folders['media'])))
});

gulp.task('app:templates', function () {
    return gulp.src(path.join(output, folders['templates'], '**/*'))
        .pipe(gulp.dest(path.join(input, 'static', folders['templates'])))
});


/* Styles collection */
gulp.task('app:css', function() {
    del([ path.join(input, 'static', folders['css'], '**/*.css') ]);
    var css = gulp.src(path.join(output, folders['scss'], '*.scss'))
        .pipe(sass());
        // .pipe(autoprefixer());
    var libCss = gulp.src([
        path.join(folders['npm'], 'bootstrap', 'dist', 'css', 'bootstrap.min.css'),
        path.join(folders['npm'], 'angularjs-bootstrap-datetimepicker', 'src', 'css', 'datetimepicker.css')
    ]).pipe(concat('lib-css.css'));
    if (isProduction) {
        css.pipe(uglifycss());
    }
    return merge(css.pipe(rev()), libCss)
        .pipe(gulp.dest(path.join(input, 'static', folders['css'])))
        .pipe(rev.manifest())
        .pipe(gulp.dest(path.join(input, 'static', folders['css'])));
});




gulp.task('all:js-clean', function() {
    del([path.join(input, 'static', 'js', '**/*')]);
});

gulp.task('all:js-start', ['all:js-clean', 'app:js', 'login:js'], function() {
    return gulp.start('app:revision');
});


/* Scripts collection */
gulp.task('app:js', function() {
    return gulp.src([
        path.join(folders['npm'], 'jquery', 'dist', 'jquery.min.js'),
        path.join(folders['npm'], 'angular', 'angular.min.js'),
        path.join(folders['npm'], 'angular-sanitize', 'angular-sanitize.js'),
        path.join(folders['npm'], 'angular-resource', 'angular-resource.min.js'),
        path.join(folders['npm'], 'panzoom', 'dist', 'panzoom.min.js'),
        path.join(folders['npm'], 'jquery.inputmask', 'dist', 'jquery.inputmask.bundle.js'),
        path.join(folders['npm'], 'angular-ui-router', 'release', 'angular-ui-router.min.js'),
        path.join(folders['npm'], 'lodash', 'lodash.min.js'),
        path.join(folders['npm'], 'moment', 'moment.js'),
        path.join(folders['npm'], 'bootstrap', 'dist', 'js', 'bootstrap.js'),
        path.join(folders['npm'], 'shaka-player', 'dist', 'shaka-player.compiled.js'),
        path.join(folders['npm'], 'angularjs-bootstrap-datetimepicker', 'src', 'js', 'datetimepicker.js'),
        path.join(folders['npm'], 'angularjs-bootstrap-datetimepicker', 'src', 'js', 'datetimepicker.templates.js'),
        path.join(output, folders['js'], 'main.js'),
        path.join(output, folders['js'], 'constants', '**/*'),
        path.join(output, folders['js'], 'controllers', '**/*'),
        path.join(output, folders['js'], 'directives', '**/*'),
        path.join(output, folders['js'], 'plugins', '**/*'),
        path.join(output, folders['js'], 'routes', '**/*'),
        path.join(output, folders['js'], 'services', '**/*'),
    ])
        .pipe(concat('main.js')).pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])))
        .pipe(rev.manifest('main.json'))
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])));
});

/* Scripts collection */
gulp.task('login:js', function() {
    var vendors = gulp.src(
        [
            path.join(folders['npm'], 'angular', 'angular.min.js'),
            path.join(folders['npm'], 'angular-resource', 'angular-resource.min.js'),
            path.join(folders['npm'], 'angular-ui-router', 'angular-ui-router.min.js'),
            path.join(output, folders['js'], 'login.js'),
            path.join(output, folders['js'], 'services', 'RequestService.js'),
            path.join(output, folders['js'], 'services', 'UsersService.js'),
            path.join(output, folders['js'], 'constants', 'API.js')
        ])
        .pipe(concat('login.js'));
    if (isProduction) {
        vendors.pipe(uglifyjs({mangle: false}));
    }
    return vendors
        .pipe(rev())
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])))
        .pipe(rev.manifest('login.json'))
        .pipe(gulp.dest(path.join(input, 'static', folders['js'])));
});


/* Styles images collection */
gulp.task('app:css-images', function() {
    return gulp.src(path.join(output, folders['scss'], 'images', '**/*'))
        .pipe(gulp.dest(path.join(input, 'static', folders['css'], 'images')));
});

//
// /* Languages */
// gulp.task('app:i18n', function() {
//     return gulp.src(path.join(output, folders['i18n'], '**/*'))
//         .pipe(gulp.dest(path.join(input, folders['static'], folders['i18n'])));
// });

gulp.task('type', function () {
  var build_type = argv.type || 'person';
  gulp.src(['./build_type/' + build_type + '.js'])
      .pipe(rename('type.js'))
      .pipe(gulp.dest('./dist/type'))
})

gulp.task('app:revision', function() {
    var manifestCSS = gulp.src(path.join(input, 'static', folders['css'], 'rev-manifest.json'));
    var manifestJS = gulp.src(path.join(input, 'static', folders['js'], 'main.json'));
    var manifestLoginJS = gulp.src(path.join(input, 'static', folders['js'], 'login.json'));

    return gulp.src(path.join(output, '*.html'))
        .pipe(revReplace({manifest: manifestCSS}))
        .pipe(revReplace({manifest: manifestJS}))
        .pipe(revReplace({manifest: manifestLoginJS}))
        .pipe(htmlreplace({title: '<title>' + (titles[project] || 'Ocular') + '</title>'}))
        .pipe(gulp.dest(input))
});

gulp.task('app:rev', ['app:css', 'all:js-start'], function() {
    return gulp.start('app:revision');
});
gulp.task('css:watcher', ['app:css'], function() {
    return gulp.start('app:revision');
});
gulp.task('watcher',function() {
    gulp.watch(path.join(output, folders['scss'], '**/*'), function() {
        gulp.start('css:watcher');
    });
    gulp.watch(path.join(output, folders['js'], '**/*'), function() {
        runSequence('all:js-start');
    });
    gulp.watch(path.join(output, folders['templates'], '**/*'), function() {
        runSequence('app:templates');
    });
    // gulp.watch(path.join(output, '*.html'), function() {
    //     runSequence('app:revision');
    // });
});


//
// gulp.task('ng-config', function() {
//     if (!fs.existsSync(input)) {
//         fs.mkdirSync(input);
//     }
//     fs.writeFileSync(path.join(input, 'config.js'),
//         JSON.stringify(config[process.env.MODE]));
//
//
//     return gulp.src(path.join(input, 'config.js'))
//         .pipe(
//             ngConfig('app', {
//                 createModule: false
//             })
//         )
//         .pipe(gulp.dest(input))
// });

gulp.task('default', ['app:media', 'type', 'app:images', 'app:favicon', 'app:fonts', 'app:css-images', 'app:templates', 'app:rev'],
    function() {
        if (!isProduction) {
            return gulp.start('watcher', ['serve']);
        }
    }
);

gulp.task('production', function(cb) {
    isProduction = true;
    runSequence('default', cb);
});
