const through = require('through2');
const File = require('vinyl');
const imageTransform = require('./image-transform');
const logMessage = require('./log-message');
const chalk = require('chalk');


// gulp task name
const TASK_NAME = 'imageSizes';

// File last modified cache
const fileModifiedTime = {};

// Image transformation instance
let transformer = null;


/**
 * Creates the gulp plugin
 *
 * @param cfg sharp config to be used
 */
const gulpTask = (cfg) => {
    // tslint:disable-next-line:triple-equals
    if (cfg == undefined) {
        throw new Error('configuration must be provided');
    } else {
        cfg.src = typeof cfg.src === 'string' ? [cfg.src] : cfg.src;
    }
    if (!cfg.dest) {
        throw new Error('destination path must be provided via configuration');
    }
    if (!cfg.src) {
        throw new Error('source path must be provided via configuration');
    }

    transformer = transformer || imageTransform(cfg);
    let fileList = [];

    return through.obj(function (file, encoding, callback) {
        // Get list of all files in the pipe (who has been modified)
        if (!fileModifiedTime[file.path] || fileModifiedTime[file.path] !== file.stat.mtimeMs) {
            fileModifiedTime[file.path] = file.stat.mtimeMs;
            fileList.push(file);
            callback(null, file);
        } else {
            // Return empty to skip the file
            return callback();
        }
    }, function (callback) {
        const fileListCache = fileList;
        let   remaining = fileList.length;
        let   totalGenerated = 0;
        fileList = [];

        fileListCache.forEach((file) => {
            transformer.add(file.path).then((convertedFiles) => {
                totalGenerated += convertedFiles.length;

                // Add list of generated files to the pipe
                convertedFiles.forEach((fileName) => {
                    this.push(new File({
                        history: [file.path],
                        path: fileName,
                        cwd: file.cwd,
                        stat: file.stat,
                    }));
                });

                if (!--remaining) {
                    // All files dones
                    logMessage('Finished', TASK_NAME, ' from ' + chalk.magenta(fileListCache.length) + ' images generated ' + chalk.magenta(totalGenerated));
                    callback();
                }
            });
        });

        if (!remaining) {
            // There were not files, all done
            callback();
        }
    });
};


module.exports = gulpTask;
