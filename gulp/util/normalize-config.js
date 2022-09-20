function getQuality (option, optimization, format) {
    if ('quality' in option) {
        if (typeof option.quality === 'number') {
            return option.quality;
        } else if (format in option.quality) {
            return option.quality[format];
        }
    }

    if (optimization[format]) {
        return optimization[format].quality || false;
    }

    return false;
}

module.exports = function normalizeConfig (config) {
    config = {
        src: config.src,
        dest: config.dest,
        resize: config.resize || false,
        cacheFileName: config.cacheFileName,
        optimization: {
            webp: config.optimization ? config.optimization.webp : false,
            png: config.optimization ? config.optimization.png : false,
            jpg: config.optimization ? config.optimization.jpg : false,
        }
    };

    // Normalize optimization quality
    const optimization = config.optimization;

    if (optimization.webp && !optimization.webp.quality) {
        optimization.webp.quality = 100;
    }
    if (optimization.png && !optimization.png.quality) {
        optimization.png.quality = 100;
    }
    if (optimization.jpg && !optimization.jpg.quality) {
        optimization.jpg.quality = 100;
    }

    if (config.resize) {
        const resize = config.resize;

        for (let glob in resize) {
            const file = resize[glob];

            for (let postfix in file) {
                const option = file[postfix];

                // Process only if there are properties for resize
                if (option && (option.width || option.height || option.minWidth || option.minHeight || option.maxWidth || option.maxHeight || option.multiplier)) {
                    option.quality = {
                        webp: getQuality(option, optimization, 'webp'),
                        png: getQuality(option, optimization, 'png'),
                        jpg: getQuality(option, optimization, 'jpg'),
                    };
                } else {
                    delete(file[postfix]);
                }
            }
        }
    } else {
        config.resize = null;
    }

    return config;
};
