const path = require('path');
const through = require('through2');
const File = require('vinyl');
const chalk = require('chalk');
const logMessage = require('./util/log-message');
const DiffTree = require('./diff-tree');
const generateDiffNodes = require('./diff-nodes');
const normalizeConfig = require('./util/normalize-config');

const CopyProcessing = require('./process/copy');
const DeleteProcessing = require('./process/delete');
const ConvertProcessing = require('./process/convert');


// gulp task name
const TASK_NAME = 'imageSizes';

// File last modified cache
const fileModifiedTime = {};


const outputStats = (fileCount, filesTotal, filesGenerated, filesDeleted, filesErrors) => {
    logMessage(
        'Finished', TASK_NAME, ' from ' + chalk.magenta(fileCount) +
        ' images generated: ' + chalk.magenta(filesGenerated) +
        ', skipped: ' + chalk.magenta(filesTotal - filesGenerated) +
        ', deleted: ' + chalk.magenta(filesDeleted) +
        ', errors: ' + (filesErrors ? chalk.redBright(filesErrors) : chalk.magenta(filesErrors))
    );
};


/**
 * Creates the gulp plugin
 *
 * @param cfg sharp config to be used
 */
const gulpTask = (cfg) => {
    cfg = normalizeConfig(cfg);

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

    const cacheFileName = path.join(cfg.dest, cfg.cacheFileName || 'cache.json');

    const copyProcessing = new CopyProcessing();
    const deleteProcessing = new DeleteProcessing();
    const convertProcessing = new ConvertProcessing();
    const tree = new DiffTree({ cache: cacheFileName, src: cfg.src, dest: cfg.dest });
    let fileList = [];

    return through.obj(function (file, encoding, callback) {
        // Get list of all files in the pipe (who has been modified)
        // In production mode we process each file only once
        if (global.production || !fileModifiedTime[file.path] || fileModifiedTime[file.path] !== file.stat.mtimeMs) {
            fileModifiedTime[file.path] = file.stat.mtimeMs;
            fileList.push(file);
            callback(null, file);
        } else {
            // Return empty to skip the file
            return callback();
        }
    }, function (callback) {
        const fileListTemp = [].concat(fileList);

        // Statistics
        const fileCount = fileListTemp.length;
        let filesTotal = 0;
        let filesGenerated = 0;
        let filesDeleted = 0;
        let filesErrors = 0;

        // Reset file list
        fileList = [];

        const promises = fileListTemp.map((file) => {
            //
            const handleResult = (result) => {
                result.success.forEach((fileName) => {
                    filesGenerated++;
                    this.push(new File({
                        history: [file.path],
                        path: fileName,
                        cwd: file.cwd,
                        stat: file.stat,
                    }));
                });
                result.failure.forEach((failure) => {
                    console.log(chalk.redBright('    Failed generating image ') + chalk.magenta(failure.fileName));
                    console.error(failure.error);
                    filesErrors++;
                });
            };

            return generateDiffNodes(file.path, cfg)
                .then((nodes) => {
                    nodes.forEach((node) => {
                        filesTotal += node.count;
                    });

                    const commands = tree.patch(nodes);
                    const promises = commands.map((command) => {
                        if (command.command === 'copy') {
                            // Copy file and inform gulp that file changed / was created
                            return copyProcessing.add(command.node).then(handleResult);
                        } else if (command.command === 'delete') {
                            // When deleting file we don't need to tell gulp that file changed
                            // and we ignore failed deletes
                            return deleteProcessing.add(command.node).then((result) => {
                                filesDeleted += result.success.length;
                            });
                        } else {
                            // Convert or resize and inform gulp that file changed / was created
                            return convertProcessing.add(command.node).then(handleResult);
                        }
                    });

                    return Promise.all(promises);
                });
        });

        Promise.all(promises)
            .then(() => {
                let promiseComplete;

                if (global.production) {
                    // In production mode all files are passed in at the same time
                    // that's why we can call .finialize() which will issue delete commands
                    // for images which were missing (images which were never loaded / copied / resized / etc.)
                    promiseComplete = Promise.all(tree.finalize().map((command) => {
                        // When deleting file we don't need to tell gulp that file changed
                        // and we ignore failed deletes
                        return deleteProcessing.add(command.node).then((result) => {
                            filesDeleted += result.success.length;

                            result.failure.forEach((failure) => {
                                console.log(chalk.redBright('    Failed deleting image ') + chalk.magenta(failure.fileName));
                                console.error(failure.error);
                            });
                        });
                    }));
                } else {
                    promiseComplete = Promise.resolve();
                }

                promiseComplete.then(() => {
                    outputStats(fileCount, filesTotal, filesGenerated, filesDeleted, filesErrors);
                    callback();
                });
            });

        if (!fileCount) {
            // There were not files, all done
            callback();
        }
    });
};


module.exports = gulpTask;
