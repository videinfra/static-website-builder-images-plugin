const path = require('path');
const minimatch = require('minimatch');
const getFileHash = require('./util/get-file-hash');

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
 * Returns encoding quality
 *
 * @param {object} optimization Optimization settings
 * @param {object|number|undefined} quality Image size specific quality settings
 * @param {string} format File format
 * @returns {number|false} Encoding quality
 */
function getEncodeOption (optimization, quality, format) {
    let encodeQuality = false;

    if (quality && quality[format]) {
        // Quality is specific to format, eg `quality: { webp: 90 }`
        encodeQuality = quality[format];
    } else if (optimization[format] && optimization[format].quality) {
        if (quality && typeof quality === 'number') {
            // Quality is not specific to format, eg `quality: 90`
            // Apply only if optimization settings have webp
            encodeQuality = quality;
        } else {
            encodeQuality = optimization[format].quality;
        }
    }

    // Returns as { quality: ... }
    return encodeQuality ? {
        quality: encodeQuality
    } : false;
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

    for (let pattern in config.resize) {
        if (minimatch(relativeFileName, pattern)) {
            const sizes = config.resize[pattern];

            for (let postfix in sizes) {
                const quality = sizes[postfix].quality;

                // Size object without 'quality'
                const size = Object.assign({}, sizes[postfix]);
                delete(size.quality);

                // Quality goes into 'encode' settings
                const encode = {
                    webp: getEncodeOption(config.optimization, quality, 'webp'),
                    png: extension === 'png' ? getEncodeOption(config.optimization, quality, 'png') : false,
                    jpg: extension === 'jpg' ? getEncodeOption(config.optimization, quality, 'jpg') : false,
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
        const encode = {
            webp: config.optimization.webp && config.optimization.webp.quality || false,
            png: extension === 'png' ? config.optimization.png && config.optimization.png.quality || false : false,
            jpg: extension === 'jpg' ? config.optimization.jpg && config.optimization.jpg.quality || false : false,
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
        return !!(node.copy || node.encode.webp || node.encode.png || node.encode.jpg);
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
    if (extension === 'jpg' || extension === 'png' || extension === 'webp') {
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
        return Promise.resolve([
            {
                sourceFileName: fileName,
                sourceHash: null,
                targetFileName: path.join(config.dest, getRelativeFileName(fileName, config)),
                resize: false,
                encode: false,
                copy: true,
                count: 1,
            }
        ]);
    }
};
