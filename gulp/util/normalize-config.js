const { getOptionProperty, getOptionFallback } = require('./get-option');

module.exports = function normalizeConfig (config) {
    const avif = getOptionProperty(config.optimization, 'quality', 'avif') || false;
    const webp = getOptionProperty(config.optimization, 'quality', 'webp') || false;
    const png = getOptionProperty(config.optimization, 'quality', 'png') || false;
    const jpg = getOptionProperty(config.optimization, 'quality', 'jpg') || false;

    config = {
        src: config.src,
        dest: config.dest,
        resize: config.resize || false,
        convert: config.convert || false,
        cacheFileName: config.cacheFileName,
        optimization: {
            avif: {
                quality: avif,
                effort: avif ? getOptionProperty(config.optimization, 'effort', 'avif', false) || 2 : false,
            },
            webp: {
                quality: webp,
                effort: webp ? getOptionProperty(config.optimization, 'effort', 'webp', false) || 4 : false,
            },
            png: {
                quality: png,
                effort: png ? getOptionProperty(config.optimization, 'effort', 'png', false) || 7 : false,
            },
            jpg: {
                quality: jpg,
                effort: false,
            },
        }
    };

    if (config.convert) {
        const convert = config.convert;

        for (let glob in convert) {
            const option = convert[glob];

            // Process only if there are properties for encoding
            const avif = getOptionFallback(getOptionProperty(option, 'quality', 'avif'), config.optimization, 'quality', 'avif');
            const webp = getOptionFallback(getOptionProperty(option, 'quality', 'webp'), config.optimization, 'quality', 'webp');
            const png = getOptionFallback(getOptionProperty(option, 'quality', 'png'), config.optimization, 'quality', 'png');
            const jpg = getOptionFallback(getOptionProperty(option, 'quality', 'jpg'), config.optimization, 'quality', 'jpg');

            if (avif) {
                option.avif = {
                    quality: avif,
                    effort: getOptionFallback(getOptionProperty(option, 'effort', 'avif', false), config.optimization, 'effort', 'avif', false),
                };
            }
            if (webp) {
                option.webp = {
                    quality: webp,
                    effort: getOptionFallback(getOptionProperty(option, 'effort', 'webp', false), config.optimization, 'effort', 'webp', false),
                };
            }
            if (png) {
                option.png = {
                    quality: png,
                    effort: getOptionFallback(getOptionProperty(option, 'effort', 'png', false), config.optimization, 'effort', 'png', false),
                };
            }
            if (jpg) {
                option.jpg = {
                    quality: jpg,
                    effort: false,
                };
            }
        }
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
                        avif: getOptionFallback(getOptionProperty(option, 'quality', 'avif'), config.optimization, 'quality', 'avif'),
                        webp: getOptionFallback(getOptionProperty(option, 'quality', 'webp'), config.optimization, 'quality', 'webp'),
                        png: getOptionFallback(getOptionProperty(option, 'quality', 'png'), config.optimization, 'quality', 'png'),
                        jpg: getOptionFallback(getOptionProperty(option, 'quality', 'jpg'), config.optimization, 'quality', 'jpg'),
                    };
                    option.effort = {
                        avif: option.quality.avif ? getOptionFallback(getOptionProperty(option, 'effort', 'avif', false), config.optimization, 'effort', 'avif', false) : false,
                        webp: option.quality.webp ? getOptionFallback(getOptionProperty(option, 'effort', 'webp', false), config.optimization, 'effort', 'webp', false) : false,
                        png: option.quality.png ? getOptionFallback(getOptionProperty(option, 'effort', 'png', false), config.optimization, 'effort', 'png', false) : false,
                        jpg: false,
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
