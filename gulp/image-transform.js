const ImagePool = require('@squoosh/lib').ImagePool;
const cpus = require('os').cpus;
const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');
const merge = require('lodash/merge');
const crop = require('./crop');
const getImageSize = require('./image-size');
const ImagePoolManager = require('./image-pool');

class ImageTransform {

    constructor (config) {
        // Total number of cpu cores, for ImagePool we will dedicate half of the cpu cores, but at least 3 if possible
        let cpuCount = cpus().length;
        cpuCount = Math.min(cpuCount, Math.max(3, Math.ceil(cpuCount / 2)));

        this.config = {
            optimization: {
                webp: config.optimization ? config.optimization.webp : false,
                png: config.optimization ? config.optimization.png : false,
                jpg: config.optimization ? config.optimization.jpg : false,
            },
            resize: config.resize || false,
            skipExisting: config.skipExisting || false,

            src: config.src || null,
            dest: config.dest || null,
        };

        const poolConfig = config.pool || {};
        
        this.imagePoolManager = new ImagePoolManager({
            cpuCount: poolConfig.maxCPUCores || cpuCount,
            parallelCount: poolConfig.maxCPUCores || cpuCount,
            resetPoolAfter: poolConfig.resetPoolAfter,
            onReset: this.resetIngestCache.bind(this)
        });

        this.fileSettingsCache = {};

        // List of files which were already skipped, we skip them only once during initial build
        this.filesSkippedCache = {};

        // To array
        if (typeof this.config.src === 'string') {
            this.config.src = [this.config.src];
        }

        if (!Array.isArray(this.config.src) || !this.config.src.length) {
            throw new Error('Image path source folders must be an array');
        }
    }

    resetIngestCache () {
    }

    normalizePath (folderName) {
        if (folderName.substr(-1) === path.sep) {
            folderName = folderName.substr(0, folderName.length - 1);
        }

        return folderName;
    }

    getRelativeSrcPath (fileFullName) {
        const srcPaths = this.config.src;

        // Look through source paths to find filename relative to source path
        for (let i = 0; i < srcPaths.length; i++) {
            const srcPath = this.normalizePath(srcPaths[i]);

            if (fileFullName.indexOf(srcPath) === 0) {
                return fileFullName.replace(srcPath, '');
            }
        }

        return null;
    }

    getDestPath (fileFullName, postfix = '', extension = '') {
        const fileBaseName = path.basename(fileFullName);
        const fileExtension = path.extname(fileBaseName);
        const fileName = path.basename(fileFullName, fileExtension);
        const filePath = this.normalizePath(fileFullName.replace(fileBaseName, ''));

        const srcPaths = this.config.src;

        // Look through source paths to find filename relative to source path
        for (let i = 0; i < srcPaths.length; i++) {
            const srcPath = this.normalizePath(srcPaths[i]);

            if (filePath.indexOf(srcPath) === 0) {
                const relativeFilePath = filePath.replace(srcPath, '') || path.sep;
                return path.join(this.config.dest, relativeFilePath, `${ fileName }${ postfix }${ extension ? '.' + extension : '' }`);
            }
        }

        return null;
    }

    getOptimizationSettings (fileName) {
        const optimization = this.config.optimization;
        const extension = path.extname(fileName).replace(/^\./, '').toLowerCase();
        // return this.config.optimization[extension];
        const settings = {
            src: fileName,
            dest: this.getDestPath(fileName),
            extension: extension,
            encode: false,
            encodeCount: 0, // to copy image / keep existing format
            resize: false,
            count: 1, // 1 == to copy image
            copy: true,
        };

        if (settings.dest) {
            if (optimization.png && extension === 'png') {
                // Copy PNG
                settings.encode = settings.encode || {};
                settings.encode.oxipng = optimization.png;
                settings.resize = {'': {}};
                settings.encodeCount++;
                settings.copy = false;
            }
            if (optimization.jpg && (extension === 'jpg' || extension === 'jpeg')) {
                // Copy JPG
                settings.encode = settings.encode || {};
                settings.encode.mozjpeg = optimization.jpg;
                settings.resize = {'': {}};
                settings.encodeCount++;
                settings.copy = false;
            }
            if (optimization.webp && (extension === 'webp')) {
                // Copy webp
                settings.encode = settings.encode || {};
                settings.encode.webp = optimization.webp;
                settings.resize = {'': {}};
                settings.encodeCount++;
                settings.copy = false;
            } else if (optimization.webp && (extension === 'jpg' || extension === 'jpeg' || extension === 'png')) {
                // Convert PNG or JPG into WEBP
                settings.encode = settings.encode || {};
                settings.encode.webp = optimization.webp;
                settings.resize = {'': {}};
                settings.encodeCount++;
                settings.count++;
            }

            return settings;
        } else {
            return null;
        }
    }
    getResizeSettings (fileSettings) {
        if (fileSettings) {
            const fileName = fileSettings.src;
            const relativeFileName = this.getRelativeSrcPath(fileName);
            const resizeConfig = this.config.resize;

            // If there is configuration and resize is supported for this file, eg. it's not SVG
            if (resizeConfig && fileSettings.resize) {
                const fileResize = {};
                let   willResize = false;

                for (let glob in resizeConfig) {
                    if (minimatch(relativeFileName, glob)) {
                        Object.assign(fileResize, resizeConfig[glob]);
                        willResize = true;
                    }
                }

                // Add encoded image count * resized count
                // By overwriting resize we skip original image since it's not needed
                if (willResize) {
                    fileSettings.count = fileSettings.encodeCount * (Object.keys(fileResize).length);
                    fileSettings.resize = fileResize;
                }
            }

            return fileSettings;
        } else {
            return null;
        }
    }

    add (fileName) {
        let fileSettings = this.fileSettingsCache[fileName];

        if (!fileSettings && fileSettings !== null) {
            this.fileSettingsCache[fileName] = fileSettings = this.getResizeSettings(this.getOptimizationSettings(fileName));
        }

        return new Promise((resolve, _reject) => {
            // Clone to prevent "resolve" from being added to the cache
            fileSettings = merge({}, fileSettings);

            if (fileSettings) {
                fileSettings.complete = 0;
                fileSettings.resolve = resolve;
                fileSettings.output = [];
                fileSettings.retries = 0;

                this.processFile(fileSettings);
            } else {
                resolve([]);
            }
        });
    }

    checkFileExists (fileSettings, fileNamePostfix) {
        const output = [];
        const promises = [];

        if (fileSettings.encode) {
            if (fileSettings.encode.oxipng) {
                output.push(`${ fileSettings.dest }${ fileNamePostfix }.png`);
            }
            if (fileSettings.encode.webp) {
                output.push(`${ fileSettings.dest }${ fileNamePostfix }.webp`);
            }
            if (fileSettings.encode.mozjpeg) {
                output.push(`${ fileSettings.dest }${ fileNamePostfix }.jpg`);
            }
        }

        for (let i = 0; i < output.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                fs.exists(output[i], (exists) => exists ? resolve() : reject());
            }));
        }


        return Promise.all(promises).then(() => {
            fileSettings.output = fileSettings.output.concat(output);
            fileSettings.complete += output.length;
            return { exists: true, fileSettings, fileNamePostfix };
        }).catch(() => {
            return { exists: false, fileSettings, fileNamePostfix };
        });
    }

    /**
     * Process image file
     *
     * @param {object} fileSettings File settings
     * @protected
     */
    processFile (fileSettings) {
        if (fileSettings.resize) {
            for (let fileNamePostfix in fileSettings.resize) {
                const skipCacheName = `${ fileSettings.dest }${ fileNamePostfix }`;

                if (this.config.skipExisting && !this.filesSkippedCache[skipCacheName]) {
                    this.filesSkippedCache[skipCacheName] = true;

                    // Check if file doesn't exist yet
                    this.checkFileExists(fileSettings, fileNamePostfix).then(({ exists, fileSettings, fileNamePostfix }) => {
                        if (exists) {
                            // File exists, mark as complete
                            if (fileSettings.complete >= fileSettings.count) {
                                fileSettings.resolve(fileSettings.output);
                            }
                        } else {
                            this.processIngest(fileSettings, fileNamePostfix);
                        }
                    });
                } else {
                    this.processIngest(fileSettings, fileNamePostfix);
                }
            }
        }

        if (fileSettings.copy) {
            // No encoding or resize, just copy file to the destination
            const destFileName = fileSettings.dest + (fileSettings.extension ? `.${ fileSettings.extension }` : '');

            fs.mkdir(path.dirname(destFileName), { recursive: true }, (err) => {
                if (err) {
                    this.handleError(err);
                }

                fs.copyFile(fileSettings.src, destFileName, (err) => {
                    if (err) {
                        this.handleError(err);
                    }

                    fileSettings.output.push(destFileName);
                    this.setFileComplete(fileSettings);
                });
            });
        }
    }

    processIngest (fileSettings, fileNamePostfix) {
        // Make sure we are not procesing same image in parallel at the same time
        fileSettings.processing = true;

        this.imagePoolManager.getImagePool().then((imagePool) => {
            fileSettings.imagePoolUsed = true;

            const image = imagePool.ingestImage(fileSettings.src);

            image.decoded.then(this.processDecoded.bind(this, image, fileSettings, fileNamePostfix), (err) => {
                this.handleError(err);

                // Problems decoding image, skip
                this.imagePoolManager.markComplete();
                this.setFileComplete(fileSettings);
            });
        });
    }

    processDecoded (image, fileSettings, fileNamePostfix, decoded) {
        const fileSize = fileSettings.resize[fileNamePostfix];
        const encode = merge({}, fileSettings.encode);

        // Resize image
        if (fileSize.width || fileSize.minWidth || fileSize.maxWidth || fileSize.height || fileSize.minHeight || fileSize.maxHeight || fileSize.multiplier) {
            const resize = getImageSize(decoded.bitmap, fileSize);
            const useCrop = resize[2];

            if (resize) {
                // squoosh doesn't have a crop / fitMethod implemented yet
                // Using custom implementation
                // @TODO Replace with squoosh built-in crop when it's ready
                // https://github.com/GoogleChromeLabs/squoosh/issues/921
                if (useCrop) {
                    decoded.bitmap = crop(decoded.bitmap, resize[0], resize[1], fileSize.position /* crop position */);
                }

                // Overwrite quality
                if (fileSize.quality) {
                    if (encode.webp) {
                        if (typeof fileSize.quality === 'number') {
                            encode.webp.quality = fileSize.quality;
                        } else if (fileSize.quality && fileSize.quality.webp) {
                            encode.webp.quality = fileSize.quality.webp;
                        }
                    }
                    if (encode.oxipng) {
                        if (typeof fileSize.quality === 'number') {
                            encode.oxipng.quality = fileSize.quality;
                        } else if (fileSize.quality && fileSize.quality.png) {
                            encode.oxipng.quality = fileSize.quality.png;
                        }
                    }
                    if (encode.mozjpeg) {
                        if (typeof fileSize.quality === 'number') {
                            encode.mozjpeg.quality = fileSize.quality;
                        } else if (fileSize.quality && fileSize.quality.jpg) {
                            encode.mozjpeg.quality = fileSize.quality.jpg;
                        }
                    }
                }

                image.preprocess({
                    resize: {
                        enabled: true,
                        width: resize[0],
                        height: useCrop ? resize[1] : null, // if we didn't cropped let squoosh calculate the height
                    }
                }).then(this.processEncode.bind(this, image, encode, fileSettings, fileNamePostfix), (err) => {
                    this.imagePoolManager.markComplete();

                    if (++fileSettings.retries < 10) {
                        // Restart file processing
                        this.processIngest(fileSettings, fileNamePostfix);
                    } else {
                        this.handleError(new Error(`To many errors, skipping "${ fileSettings.src }"`), false);
                        this.setFileComplete(fileSettings);
                    }
                });
            } else {
                // Resize not needed, only converting format and/or optimizing
                this.processEncode(image, encode, fileSettings, fileNamePostfix);
            }
        } else {
            // Resize not needed, only converting format and/or optimizing
            this.processEncode(image, encode, fileSettings, fileNamePostfix);
        }
    }

    processEncode (image, encode, fileSettings, fileNamePostfix) {
        image.encode(encode).then(() => {
            const encodedImages = Object.values(image.encodedWith);
            const count = encodedImages.length;
            let   processed = 0;

            for (const encodedImage of encodedImages) {
                encodedImage.then((encodedImage) => {
                    const binary = encodedImage.binary;
                    const destFileExtension = encodedImage.extension;
                    const destFile = `${ fileSettings.dest }${ fileNamePostfix }.${ destFileExtension }`;

                    fs.mkdir(path.dirname(destFile), { recursive: true }, (err) => {
                        fileSettings.output.push(destFile);

                        if (err) {
                            this.handleError(err);

                            processed++;
                            if (processed === count) {
                                fileSettings.processing = false;
                                this.imagePoolManager.markComplete();
                            }

                            this.setFileComplete(fileSettings);
                        } else {
                            fs.writeFile(destFile, binary, (err) => {
                                if (err) {
                                    this.handleError(err);
                                }

                                processed++;
                                if (processed === count) {
                                    fileSettings.processing = false;
                                    this.imagePoolManager.markComplete();
                                }

                                this.setFileComplete(fileSettings);
                            });
                        }
                    });
                }, (err) => {
                    this.handleError(err);
                });
            }
        }, (err) => {
            this.handleError(err);
            this.setFileComplete(fileSettings);
            this.imagePoolManager.markComplete();
        }).catch((err) => {
            this.handleError(err);
            this.setFileComplete(fileSettings);
            this.imagePoolManager.markComplete();
        });
    }

    setFileComplete (fileSettings) {
        fileSettings.complete++;

        if (fileSettings.complete >= fileSettings.count) {
            fileSettings.resolve(fileSettings.output);
        }
    }

    /**
     * Handle error by outputing to console
     *
     * @param {object} err Error
     * @param {boolean} simplified Output only error message text
     * @protected
     */
    handleError (err, simplified) {
        if (simplified && err.message) {
            console.error(err.message);
        } else {
            console.error(err);
        }
    }
}

module.exports = function (config) {
    return new ImageTransform(config);
};
