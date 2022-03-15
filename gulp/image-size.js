/**
 * Returns size into which image will be resized
 * Calculates so that ratio is preserved, but image is only resized down, not up
 *
 * @param {object} bitmap Bitmap image
 * @param {object} options Resize options
 * @returns {array} New image width and height
 * @protected
 */
module.exports = function getImageSize (bitmap, options = {}) {
    if (options.multiplier) {
        return [
            Math.ceil(bitmap.width * options.multiplier),
            Math.ceil(bitmap.height * options.multiplier),
            false, // no crop
        ];
    } else if (options.width || options.height) {
        let ratio = null;
        let newWidth = options.width;
        let newHeight = options.height;
        let crop = false

        if (newWidth && !newHeight) {
            ratio = bitmap.width / bitmap.height;
            newHeight = newWidth / ratio;
        } else if (newHeight && !newWidth) {
            ratio = bitmap.width / bitmap.height;
            newWidth = newHeight * ratio;
        } else {
            ratio = options.width / options.height;
            crop = true;
        }

        if (bitmap.width < newWidth || bitmap.height < newHeight) {
            newWidth = bitmap.height * ratio;
            newHeight = bitmap.height;

            if (bitmap.width < newWidth) {
                newWidth = bitmap.width;
                newHeight = bitmap.width / ratio;
            }
        }

        // Use crop if ratio has changed
        if (crop) {
            const newRatio = newWidth / newHeight;
            if (newRatio.toFixed(5) !== ratio.toFixed(5)) {
                crop = true
            }
        }

        return [
            Math.floor(newWidth),
            Math.floor(newHeight),
            crop,
        ];
    } else {
        return null;
    }
};
