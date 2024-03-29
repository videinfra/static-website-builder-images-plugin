const gulp = require('gulp');
const gulpTask = require('./gulp/task');
const nanomemoize = require('nano-memoize');
const memoize = typeof nanomemoize === 'function' ? nanomemoize : nanomemoize.default;

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
        globs.paths(sourcePaths).paths(ignore).ignore()           // List of files which to ignore
    );
});


function imageSizes () {
    const taskConfig = Object.assign({}, getConfig.getTaskConfig('imageSizes'), {
        src: getPaths.getSourcePaths('imageSizes'),
        dest: getPaths.getDestPath('imageSizes'),
    });

    return gulp
        // Don't actually read file, that's done by image plugin
        .src(getGlobPaths(), { read: false })
        .pipe(taskStart())

        .pipe(gulpTask(taskConfig))

        .pipe(taskBeforeDest())

        // Reload on change
        .pipe(taskEnd());
}

function imageSizesWatch () {
    return taskWatch(getGlobPaths(), imageSizes);
}

exports.build = imageSizes;
exports.watch = imageSizesWatch;
