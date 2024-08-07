const path = require('path');
const sharp = require('sharp');
const getImagePosition = require('../util/get-image-position');
const getImageSize = require('../util/get-image-size');
const fsPromises = require('fs').promises;

/**
 * Converts image formats and resizes images
 */
class ConvertProcessing {
    constructor () {
        this.streams = {};
        this.queue = [];
    }

    /**
     * Add node for processing
     *
     * @param {object} node Node
     * @returns {Promise} Promise which is resolved when image processing is done
     */
    add (node) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                resolve,
                reject,
                node: node,
                processing: false
            });

            setTimeout(() => { this.next(); }, 16);
        });
    }

    /**
     * Process next image
     *
     * @protected
     */
    next () {
        const next = this.queue.find((element) => element.processing === false);

        if (next) {
            next.processing = true;

            this.getStream(next.node.sourceFileName)
                .then((stream) => {
                    this.convert(next, stream);
                })
                .catch((err) => {
                    next.reject(err);
                });
        }
    }

    /**
     * Returns sharp stream from input file name
     *
     * @param {string} sourceFileName Input file name
     * @returns {Promise} Prmomise which is resolved with { image, metadata }
     */
    getStream (sourceFileName) {
        if (!this.streams[sourceFileName]) {
            this.streams[sourceFileName] = new Promise((resolve, reject) => {
                const image = sharp(sourceFileName, {
                    // can reduce memory usage and might improve performance on some systems
                    sequentialRead: true
                });
                image.metadata()
                    .then((metadata) => {
                        resolve({ image: image, metadata: metadata });
                    })
                    .catch(reject);
            });
        }

        return this.streams[sourceFileName];
    }

    /**
     * Remove streams which are no longed needed when all queued nodes have been
     * processed for input file
     *
     * @protected
     */
    cleanUpStreams () {
        const streams = this.streams;
        const queue = this.queue;

        for (let sourceFileName in streams) {
            const node = queue.find((element) => element.node.sourceFileName === sourceFileName);

            // Remove stream if there are no queued nodes with given name
            if (!node) {
                delete(streams[sourceFileName]);
            }
        }
    }

    /**
     * Remove items from the queue which have been already processed
     *
     * @param {object} item Item
     * @protected
     */
    removeFromQueue (item) {
        this.queue = this.queue.filter((currentItem) => {
            return currentItem !== item;
        });
    }

    /**
     * Convert next node
     *
     * @param {object} next Object with 'node', 'resolve', 'reject'
     * @param {object} stream Object with 'image', 'metadata'
     */
    convert (next, stream) {
        const resize = next.node.resize ? getImageSize(stream.metadata, next.node.resize) : null;
        const position = resize ? getImagePosition(resize, next.node.resize) : null;
        const encode = next.node.encode;

        // Save original size into node data (cache)
        next.node.sourceSize = { width: stream.metadata.width, height: stream.metadata.height };

        // Get list of all formats into which we need to convert
        const formats = encode ? Object.keys(encode).filter((name) => !!encode[name]) : [];

        // List of generated files
        const result = {
            success: [],
            failure: []
        };

        let converted = stream.image.clone();

        if (resize) {
            if (position) {
                // Resize
                converted = converted.resize({
                    width: position.resize.width,
                    height: position.resize.height,
                    fit: sharp.fit.cover,
                    withoutEnlargement: true
                });

                // Crop after resizing
                converted = converted.extract(position.extract);
            } else {
                converted = converted.resize({
                    width: resize.cropWidth,
                    height: resize.cropHeight,
                    fit: sharp.fit.cover,
                    withoutEnlargement: true
                });
            }
        }

        const nextFormat = () => {
            if (formats.length) {
                const format = formats.shift();
                const outputFileName = next.node.targetFileName + '.' + format;
                const formatFunctionName = format === 'jpg' ? 'jpeg' : format;

                if (formatFunctionName in converted) {
                    const encodeOptions = {
                        quality: encode[format].quality,
                    };

                    if (encode[format].effort || encode[format].effort === 0) {
                        encodeOptions.effort = encode[format].effort;
                    }

                    converted = converted[formatFunctionName](encodeOptions);
                    converted
                        .toFile(outputFileName)
                            .then(() => {
                                result.success.push(outputFileName);
                                nextFormat();
                            })
                            .catch((err) => {
                                result.failure.push({ fileName: outputFileName, error: err });
                                nextFormat();
                            });
                } else {
                    // sharp doesn't support specified format
                    nextFormat();
                }
            } else {
                this.removeFromQueue(next);
                this.cleanUpStreams();

                next.resolve(result);
            }
        };

        this.createFolder(next.node.targetFileName)
            .then(nextFormat)
            .catch(() => {
                next.reject();
            });
    }

    /**
     * Create folder
     *
     * @param {string} targetFileName Filename
     * @returns {Promise}
     * @protected
     */
    createFolder (targetFileName) {
        const folder = path.dirname(targetFileName);
        return fsPromises.mkdir(folder, { recursive: true });
    }
}

module.exports = ConvertProcessing;
