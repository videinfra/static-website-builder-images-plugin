const ImagePool = require('@squoosh/lib').ImagePool;
const cpus = require('os').cpus;
const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');
const merge = require('lodash/merge');
const crop = require('./crop');
const getImageSize = require('./image-size');

class ImageTransform {

    constructor (config) {
        this.config = {
            optimization: {
                webp: config.optimization ? config.optimization.webp : false,
                png: config.optimization ? config.optimization.png : false,
                jpg: config.optimization ? config.optimization.jpg : false,
            },
            resize: config.resize || false,

            src: config.src || null,
            dest: config.dest || null,
        };

        this.fileSettingsCache = {};
        this.queue = [];
        this.cpuActive = 0;
        this.cpuCount = Math.ceil(cpus().length / 2);
        this.imagePool = null;
        this.stats = {
            startTime: 0,
            count: 0,
            complete: 0,
        };

        // To array
        if (typeof this.config.src === 'string') {
            this.config.src = [this.config.src];
        }

        if (!Array.isArray(this.config.src) || !this.config.src.length) {
            throw new Error('Image path source folders must be an array');
        }
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

            if (resizeConfig) {
                for (let glob in resizeConfig) {
                    if (minimatch(relativeFileName, glob)) {
                        Object.assign(fileSettings.resize, resizeConfig[glob]);
                    }
                }

                // Add encoded image count * resized count
                fileSettings.count += fileSettings.encodeCount * (Object.keys(fileSettings.resize).length - 1);
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

                this.processFile(fileSettings);
            } else {
                resolve([]);
            }
        });
    }

    /**
     * Process image file
     *
     * @param {object} fileSettings File settings
     * @protected
     */
    processFile (fileSettings) {
        this.setTotalCount(this.stats.count + fileSettings.count);

        if (fileSettings.resize) {
            for (let fileNamePostfix in fileSettings.resize) {
                this.queue.push({
                    fileSettings: fileSettings,
                    fileNamePostfix: fileNamePostfix,
                });

                this.processNext();
            }
        }

        if (fileSettings.copy) {
            // No encoding or resize, just copy file to the destination
            const destFileName = fileSettings.dest + (fileSettings.extension ? `.${ fileSettings.extension }` : '');

            fs.mkdir(path.dirname(destFileName), { recursive: true }, (_err) => {
                if (_err) {
                    console.error(_err);
                }

                fs.copyFile(fileSettings.src, destFileName, (err) => {
                    if (err) {
                        // @TODO Handle error
                    }

                    fileSettings.output.push(destFileName);
                    this.setFileComplete(fileSettings);
                });
            });
        }
    }

    processNext () {
        if (this.cpuActive < this.cpuCount) {
            const item = this.queue.shift();
            if (item) {
                this.cpuActive++;
                this.processDigest(item.fileSettings, item.fileNamePostfix);
            }
        }
    }

    processDigest (fileSettings, fileNamePostfix) {
        const imagePool = this.getImagePool();
        const image = imagePool.ingestImage(fileSettings.src);

        image.decoded.then((decoded) => {
            const fileSize = fileSettings.resize[fileNamePostfix];
            const encode = merge({}, fileSettings.encode);

            // Resize image
            if (fileSize.width || fileSize.height || fileSize.multiplier) {
                const resize = getImageSize(decoded.bitmap, fileSize);

                if (resize) {
                    // squoosh doesn't have a crop / fitMethod implemented yet
                    // Using custom implementation
                    // @TODO Replace with squoosh built-in crop when it's ready
                    // https://github.com/GoogleChromeLabs/squoosh/issues/921
                    decoded.bitmap = crop(decoded.bitmap, resize[0], resize[1], fileSize.position /* crop position */);

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
                            } else if (fileSize.quality && fileSize.quality.webp) {
                                encode.oxipng.quality = fileSize.quality.webp;
                            }
                        }
                        if (encode.mozjpeg) {
                            if (typeof fileSize.quality === 'number') {
                                encode.mozjpeg.quality = fileSize.quality;
                            } else if (fileSize.quality && fileSize.quality.webp) {
                                encode.mozjpeg.quality = fileSize.quality.webp;
                            }
                        }
                    }

                    image.preprocess({
                        resize: {
                            enabled: true,
                            width: resize[0],
                            height: resize[1],
                        }
                    }).then(this.processEncode.bind(this, image, encode, fileSettings, fileNamePostfix));
                } else {
                    // Resize not needed, only converting format and/or optimizing
                    this.processEncode(image, encode, fileSettings, fileNamePostfix);
                }
            } else {
                // Resize not needed, only converting format and/or optimizing
                this.processEncode(image, encode, fileSettings, fileNamePostfix);
            }
        });
    }

    processEncode (image, encode, fileSettings, fileNamePostfix) {
        image.encode(encode).then(() => {
            const encodedImages = Object.values(image.encodedWith);

            for (const encodedImage of encodedImages) {
                encodedImage.then((encodedImage) => {
                    const binary = encodedImage.binary;
                    const destFileExtension = encodedImage.extension;
                    const destFile = `${ fileSettings.dest }${ fileNamePostfix }.${ destFileExtension }`;

                    fs.mkdir(path.dirname(destFile), { recursive: true }, (_err) => {
                        fileSettings.output.push(destFile);

                        fs.writeFile(destFile, binary, (_err) => {
                            this.setFileComplete(fileSettings);
                        });
                    });
                });
            }

            this.cpuActive--;
            this.processNext();
        }).catch((_err) => {
            this.setFileComplete(fileSettings);

            this.cpuActive--;
            this.processNext();
        });
    }

    getImagePool () {
        if (!this.imagePool) {
            this.stats.count = this.stats.count - this.stats.complete;
            this.stats.complete = 0;
            this.stats.startTime = Date.now();

            this.imagePool = new ImagePool(this.cpuCount);
        }
        return this.imagePool;
    }

    setTotalCount (count) {
        this.stats.count = count;
    }

    setFileComplete (fileSettings) {
        fileSettings.complete++;
        this.stats.complete++;

        if (fileSettings.count === fileSettings.complete) {
            if (this.stats.complete === this.stats.count) {
                this.done();
            }

            fileSettings.resolve(fileSettings.output);
        }
    }

    done () {
        // Delay to make sure there are no other images added
        // during interupt, this is important because we are closing
        // pool
        setTimeout(() => {
            if (this.stats.complete === this.stats.count) {
                if (this.imagePool) {
                    this.imagePool.close();
                    this.imagePool = null;
                }
            }
        }, 60);
    }
}


module.exports = function (config) {
    return new ImageTransform(config);
};
