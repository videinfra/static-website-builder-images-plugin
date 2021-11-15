const gulp = require('gulp');
const memoize = require('nano-memoize');
const gulpSharp = require('@donmahallem/gulp-sharp').gulpSharp;

const globs = require('@videinfra/static-website-builder/lib/globs-helper');
const getPaths = require('@videinfra/static-website-builder/lib/get-path');
const getConfig = require('@videinfra/static-website-builder/lib/get-config');

const taskStart = require('@videinfra/static-website-builder/lib/gulp/task-start');
const taskEnd = require('@videinfra/static-website-builder/lib/gulp/task-end');
const taskBeforeDest = require('@videinfra/static-website-builder/lib/gulp/task-before-dest');
const taskWatch = require('@videinfra/static-website-builder/lib/gulp/task-watch');


const getGlobPaths = memoize(function () {
    const sourcePaths = getPaths.getSourcePaths('imageSizes');
    const extensions = getConfig.getTaskConfig('imageSizes', 'extensions');
    const ignore = getConfig.getTaskConfig('imageSizes', 'ignore');

    return globs.generate(
        globs.paths(sourcePaths).filesWithExtensions(extensions), // Files to watch
        globs.paths(sourcePaths).paths(ignore).ignore(),          // List of files which to ignore
    );
});


function imageSizes () {
    return gulp
        .src(getGlobPaths(), { since: gulp.lastRun(imageSizes) })
        .pipe(taskStart())

        .pipe(gulpSharp({
            modifyFilename: false,
            transform: function (sharp) {
                // Convert to webp
                sharp = sharp.webp({quality: 100});
                return sharp;
            },
            config: {
            },
        }))

        .pipe(taskBeforeDest())
        .pipe(gulp.dest(getPaths.getDestPath('imageSizes')))

        // Reload on change
        .pipe(taskEnd());
}

function imageSizesWatch () {
    return taskWatch(getGlobPaths(), imageSizes);
}


exports.build = imageSizes;
exports.watch = imageSizesWatch;
