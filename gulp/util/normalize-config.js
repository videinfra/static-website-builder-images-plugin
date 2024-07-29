const { getQuality, qualityFallback } = require('./get-quality');

module.exports = function normalizeConfig (config) {
    config = {
        src: config.src,
        dest: config.dest,
        resize: config.resize || false,
        convert: config.convert || false,
        cacheFileName: config.cacheFileName,
        optimization: {
            avif: getQuality(config.optimization, 'avif') || false,
            webp: getQuality(config.optimization, 'webp') || false,
            png: getQuality(config.optimization, 'png') || false,
            jpg: getQuality(config.optimization, 'jpg') || false,
        }
    };

    if (config.convert) {
        const convert = config.convert;

        for (let glob in convert) {
            const option = convert[glob];

            // Process only if there are properties for encoding
            option.avif = qualityFallback(getQuality(option, 'avif'), config.optimization, 'avif');
            option.webp = qualityFallback(getQuality(option, 'webp'), config.optimization, 'webp');
            option.png = qualityFallback(getQuality(option, 'png'), config.optimization, 'png');
            option.jpg = qualityFallback(getQuality(option, 'jpg'), config.optimization, 'jpg');
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
                        avif: qualityFallback(getQuality(option, 'avif'), config.optimization, 'avif'),
                        webp: qualityFallback(getQuality(option, 'webp'), config.optimization, 'webp'),
                        png: qualityFallback(getQuality(option, 'png'), config.optimization, 'png'),
                        jpg: qualityFallback(getQuality(option, 'jpg'), config.optimization, 'jpg'),
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
