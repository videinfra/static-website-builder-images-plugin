/**
 * Returns position for cropping (sharp `extract`)
 *
 * @param {object} size Image size
 * @param {number} size.width Image width into which it will be resized
 * @param {number} size.height Image height into which it will be resized
 * @param {number} size.cropWidth Image width into which it will be resized & cropped
 * @param {number} size.cropHeight Image height into which it will be resized & cropped
 * @param {array} position X, Y coordinates for cropping
 * @returns {object} Image position data
 */

module.exports = function getImagePosition (size, options = {}) {
    if (size.crop && options.position) {
        const x = (size.width - size.cropWidth) * options.position[0];
        const y = (size.height - size.cropHeight) * options.position[1];

        return {
            // Parameters for sharp `resize` function
            resize: {
                width: size.width,
                height: size.height,
            },

            // Parameters for sharp `extract` function
            extract: {
                left: Math.floor(x),
                top: Math.floor(y),
                width: size.cropWidth,
                height: size.cropHeight,
            }
        };
    } else {
        return null;
    }
}
