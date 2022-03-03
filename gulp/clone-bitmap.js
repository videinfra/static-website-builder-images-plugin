/**
 * Clone bitmap object
 *
 * @param {object} bitmap Bitmap object
 * @returns {object} Cloned bitmap object
 * @protected
 */
module.exports = function cloneBitmap (bitmap) {
    return new ImageData(
        new Uint8ClampedArray(bitmap.data),
        bitmap.width,
        bitmap.height
    );
};
