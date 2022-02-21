module.exports = function crop (bitmap, width, height, position) {
    const bmWidth = bitmap.width;
    const bmHeight = bitmap.height;
    const data = bitmap.data;

    // Default is to center
    position = position || [0.5, 0.5];

    if (width && height) {
        // Calculate width and height on full image
        const ratio = Math.min(bmWidth / width, bmHeight / height);

        const targetWidth = Math.ceil(width * ratio);
        const targetHeight = Math.ceil(height * ratio);
        const x = Math.round((bmWidth - targetWidth) * position[0]);
        const y = Math.round((bmHeight - targetHeight) * position[1]);

        // Check if sizes are different
        if (targetWidth !== bmWidth || targetHeight !== bmHeight) {
            // 4 bytes per pixel
            const buffer = new Uint8ClampedArray(targetWidth * targetHeight * 4);

            for (let i = 0; i < targetWidth; i++) {
                for (let k = 0; k < targetHeight; k++) {
                    const targetIndex = (i + k * targetWidth) * 4;
                    const sourceIndex = (i + x + (k + y) * bmWidth) * 4;

                    buffer[targetIndex + 0] = data[sourceIndex + 0];
                    buffer[targetIndex + 1] = data[sourceIndex + 1];
                    buffer[targetIndex + 2] = data[sourceIndex + 2];
                    buffer[targetIndex + 3] = data[sourceIndex + 3];
                }
            }

            return {
                width: targetWidth,
                height: targetHeight,
                data: buffer,
            };
        }
    }

    return bitmap;
};
