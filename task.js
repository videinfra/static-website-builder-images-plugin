import gulp from 'gulp';
import gulpTask from './gulp/task.js';
import { nanomemoize } from 'nano-memoize';

import globs from '@videinfra/example-website-builder/lib/globs-helper.js';
import { getSourcePaths, getDestPath } from '@videinfra/static-website-builder/lib/get-path.js';
import getConfig from '@videinfra/static-website-builder/lib/get-config.js';

import taskStart from '@videinfra/static-website-builder/lib/gulp/task-start.js';
import taskEnd from '@videinfra/static-website-builder/lib/gulp/task-end.js';
import taskBeforeDest from '@videinfra/static-website-builder/lib/gulp/task-before-dest.js';
import taskWatch from '@videinfra/static-website-builder/lib/gulp/task-watch.js';

const getWatchGlobPaths = function (forChokidar = false) {
    const sourcePaths = getSourcePaths('imageSizes');
    const extensions = getConfig.getTaskConfig('imageSizes', 'extensions');
    const ignore = getConfig.getTaskConfig('imageSizes', 'ignore');

    return globs.generate(
        globs.paths(sourcePaths).filesWithExtensions(extensions), // Files to watch
        globs.paths(sourcePaths).paths(ignore).ignore(), // List of files which to ignore
        forChokidar,
    );
};
const getGlobPaths = nanomemoize.nanomemoize(function () {
    return getWatchGlobPaths(false);
});

function imageSizes() {
    const taskConfig = Object.assign({}, getConfig.getTaskConfig('imageSizes'), {
        src: getSourcePaths('imageSizes'),
        dest: getDestPath('imageSizes'),
    });

    return (
        gulp
            // Don't actually read file, that's done by image plugin
            .src(getGlobPaths(), { read: false })
            .pipe(taskStart())

            .pipe(gulpTask(taskConfig))

            .pipe(taskBeforeDest())

            // Reload on change
            .pipe(taskEnd())
    );
}

function imageSizesWatch() {
    return taskWatch(getWatchGlobPaths(true), imageSizes);
}

export const build = imageSizes;
export const watch = imageSizesWatch;
