function clamp (value, min, max) {
    return value ? Math.min(Math.max(value, min || 0), max || Number.POSITIVE_INFINITY) : min || max;
}

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
    } else if (options.width || options.height || options.minWidth || options.minHeight || options.maxWidth || options.maxHeight) {
        const ratio = bitmap.width / bitmap.height;
        let width = null;
        let height = null;
        let minWidth = options.minWidth;
        let maxWidth = options.maxWidth;
        let minHeight = options.minHeight;
        let maxHeight = options.maxHeight;
        let crop = false;

        if (options.width) {
            width = minWidth = maxWidth = options.width;
            height = width / ratio;
        }
        if (options.height) {
            height = minHeight = maxHeight = options.height;
            width = height * ratio;
        }

        let newWidth = clamp(width, minWidth, maxWidth);
        let newHeight = clamp(height, minHeight, maxHeight);

        if (newWidth && newWidth !== width) {
            width = newWidth;
            height = width / ratio;

            newHeight = clamp(height, minHeight, maxHeight);

            if (newHeight && newHeight !== height) {
                height = newHeight;
                width = clamp(height * ratio, minWidth, maxWidth);
            }
        }
        if (newHeight && newHeight !== height) {
            height = newHeight;
            width = height * ratio;

            newWidth = clamp(width, minWidth, maxWidth);

            if (newWidth && newWidth !== width) {
                width = newWidth;
                height = clamp(width / ratio, minHeight, maxHeight);
            }
        }

        // Final adjustment, make sure output images is smaller than original
        // preserve calculated ratio, but ignore min/max
        const newRatio = width / height;

        if (bitmap.width < width || bitmap.height < height) {
            height = bitmap.height;
            width = height * newRatio;

            if (bitmap.width < width) {
                width = bitmap.width;
                height = width / newRatio;
            }
        }

        // Use crop if ratio has changed
        if (newRatio.toFixed(5) !== ratio.toFixed(5)) {
            crop = true
        }

        return [
            Math.floor(width),
            Math.floor(height),
            crop,
        ];
    } else {
        return null;
    }
};
