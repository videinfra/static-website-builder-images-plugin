const path = require('path');
const minimatch = require('minimatch');
const getFileHash = require('./util/get-file-hash');
const { getOptionProperty, getOptionFallback } = require('./util/get-option');

function getExtension (fileName) {
    const extension = path.extname(fileName).replace(/^\./, '').toLowerCase();
    return extension === 'jpeg' ? 'jpg' : extension;
}

/**
 * Remove slash from the ending of the folder name
 *
 * @param {string} folderName Folder name
 * @returns {string} Folder name without slash at the end
 */
function normalizePath (folderName) {
    if (folderName.substr(-1) === path.sep) {
        folderName = folderName.substr(0, folderName.length - 1);
    }

    return folderName;
}

/**
 * Returns file name relative to source folder
 *
 * @param {string} fileName File name
 * @param {object} config Config
 * @returns {string} Relative file name
 */
function getRelativeFileName (fileName, config) {
    const srcPaths = config.src;

    // Look through source paths to find filename relative to source path
    for (let i = 0; i < srcPaths.length; i++) {
        const srcPath = normalizePath(srcPaths[i]);

        if (fileName.indexOf(srcPath) === 0) {
            return fileName.replace(srcPath, '');
        }
    }

    return null;
}

/**
 * Remove file extension
 *
 * @param {string} fileName File name
 * @returns {string} File name without extension
 */
function removeFileExtension (fileName) {
    return fileName.replace(/\.[^.\/\\]*?$/, '');
}

/**
 * Returns list of nodes where each node is for one specific size
 *
 * @param {string} fileName Input file name
 * @param {object} config Configuration
 * @returns {array} List of nodes
 */
function getSizes (fileName, config) {
    const relativeFileName = getRelativeFileName(fileName, config);
    const relativeFileNameNoExtension = removeFileExtension(relativeFileName);
    const extension = getExtension(fileName);
    const sizeNodes = [];

    for (let pattern in config.convert) {
        if (minimatch(relativeFileName, pattern)) {
            const quality = config.convert[pattern];
            const webp = getOptionFallback(getOptionProperty(quality, 'quality', 'webp'), config.optimization, 'quality', 'webp');
            const avif = getOptionFallback(getOptionProperty(quality, 'quality', 'avif'), config.optimization, 'quality', 'avif');
            const png = getOptionFallback(getOptionProperty(quality, 'quality', 'png'), config.optimization, 'quality', 'png');
            const jpg = getOptionFallback(getOptionProperty(quality, 'quality', 'jpg'), config.optimization, 'quality', 'jpg');

            const encode = {
                webp: webp ? {
                    quality: webp,
                    effort: getOptionFallback(getOptionProperty(quality, 'effort', 'webp', false), config.optimization, 'effort', 'webp', false),
                } : false,
                avif: avif ? {
                    quality: avif,
                    effort: getOptionFallback(getOptionProperty(quality, 'effort', 'avif', false), config.optimization, 'effort', 'avif', false),
                } : false,
                png: png ? {
                    quality: png,
                    effort: getOptionFallback(getOptionProperty(quality, 'effort', 'png', false), config.optimization, 'effort', 'png', false),
                } : false,
                jpg: jpg ? {
                    quality: jpg,
                    effort: false,
                } : false,
            };

            sizeNodes.push({
                targetFileName: path.join(config.dest, relativeFileNameNoExtension),
                resize: false,
                encode: encode,
                copy: false,
                count: Object.keys(encode).filter((name) => !!encode[name]).length,
            });
        }
    }

    for (let pattern in config.resize) {
        if (minimatch(relativeFileName, pattern)) {
            const sizes = config.resize[pattern];

            for (let postfix in sizes) {
                const quality = sizes[postfix].quality;
                const effort = sizes[postfix].effort;

                // Size object without 'quality' and 'effort'
                const size = Object.assign({}, sizes[postfix]);
                delete(size.quality);
                delete(size.effort);

                // Quality goes into 'encode' settings
                const webp = getOptionFallback(getOptionProperty(quality, 'quality', 'webp'), config.optimization, 'quality', 'webp');
                const avif = getOptionFallback(getOptionProperty(quality, 'quality', 'avif'), config.optimization, 'quality', 'avif');
                const png = getOptionFallback(getOptionProperty(quality, 'quality', 'png'), config.optimization, 'quality', 'png');
                const jpg = getOptionFallback(getOptionProperty(quality, 'quality', 'jpg'), config.optimization, 'quality', 'jpg');

                const encode = {
                    webp: webp ? {
                        quality: webp,
                        effort: getOptionFallback(getOptionProperty(effort, 'effort', 'webp'), config.optimization, 'effort', 'webp', false),
                    } : false,
                    avif: avif ? {
                        quality: avif,
                        effort: getOptionFallback(getOptionProperty(effort, 'effort', 'avif'), config.optimization, 'effort', 'avif', false),
                    } : false,
                    png: png ? {
                        quality: png,
                        effort: getOptionFallback(getOptionProperty(effort, 'effort', 'png'), config.optimization, 'effort', 'png', false),
                    } : false,
                    jpg: jpg ? {
                        quality: jpg,
                        effort: false,
                    } : false,
                };

                sizeNodes.push({
                    targetFileName: path.join(config.dest, relativeFileNameNoExtension + postfix),
                    resize: size,
                    encode: encode,
                    copy: false,
                    count: Object.keys(encode).filter((name) => !!encode[name]).length,
                });
            }
        }
    }

    // There are no sizes, only optimize the image and convert formats
    if (!sizeNodes.length) {
        const webp = getOptionProperty(config.optimization, 'quality', 'webp') || false;
        const avif = getOptionProperty(config.optimization, 'quality', 'avif') || false;
        const png = extension === 'png' ? getOptionProperty(config.optimization, 'quality', 'png') || false : false;
        const jpg = extension === 'jpg' ? getOptionProperty(config.optimization, 'quality', 'jpg') || false : false;

        const encode = {
            webp: webp ? {
                quality: webp,
                effort: getOptionProperty(config.optimization, 'effort', 'webp', false) || false,
            } : false,
            avif: avif ? {
                quality: avif,
                effort: getOptionProperty(config.optimization, 'effort', 'avif', false) || false,
            } : false,
            png: png ? {
                quality: png,
                effort: getOptionProperty(config.optimization, 'effort', 'png', false) || false,
            } : false,
            jpg: jpg ? {
                quality: jpg,
                effort: false,
            } : false,
        };

        sizeNodes.push({
            targetFileName: path.join(config.dest, relativeFileNameNoExtension),
            resize: false,
            encode: encode,
            copy: false,
            count: Object.keys(encode).filter((name) => !!encode[name]).length,
        });
    }

    // Filter out sizes which doesn't have any encode options and is not 'copy'
    return sizeNodes.filter((node) => {
        return !!(node.copy || node.encode.webp || node.encode.avif || node.encode.png || node.encode.jpg);
    });
}

/**
 * Generate nodes where each node is a an output file, except for formats
 * Each image output size has separate node
 *
 * @param {string} fileName Input file name
 * @param {object} config Configuration
 * @returns {array} List of nodes
 */
module.exports = function generateDiffNodes (fileName, config) {
    const extension = getExtension(fileName);

    // Only specific file formats can be converted
    if (extension === 'jpg' || extension === 'png' || extension === 'webp' || extension === 'avif') {
        const sizes = getSizes (fileName, config);

        return getFileHash(fileName)
            .then((hash) => {
                return sizes.map((size) => {
                    return Object.assign({
                        sourceFileName: fileName,
                        sourceHash: hash,
                    }, size);
                });
            })
            .catch(() => {
                return sizes.map((size) => {
                    return Object.assign({
                        sourceFileName: fileName,
                        sourceHash: null,
                    }, size);
                });
            });
    } else {
        // All other files needs to be just copied
        return getFileHash(fileName)
            .then((hash) => {
                return [{
                    sourceFileName: fileName,
                    sourceHash: hash,
                    targetFileName: path.join(config.dest, getRelativeFileName(fileName, config)),
                    resize: false,
                    encode: false,
                    copy: true,
                    count: 1,
                }];
            })
            .catch(() => {
                return [{
                    sourceFileName: fileName,
                    sourceHash: null,
                    targetFileName: path.join(config.dest, getRelativeFileName(fileName, config)),
                    resize: false,
                    encode: false,
                    copy: true,
                    count: 1,
                }];
            });
    }
};
