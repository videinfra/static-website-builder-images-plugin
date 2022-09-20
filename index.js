// Disable regular 'images' plugin
exports.images = false;

exports.imageSizes = {
    // Glob list of files, which to ignore, relative to the image source folder
    // see https://gulpjs.com/docs/en/getting-started/explaining-globs/
    ignore: [
    ],

    // Image file extensions
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'svg', 'avif', 'tiff'],

    // Optimization settings + format conversion
    optimization: false,

    /*
    optimization: {
        // Converting from PNG or JPG into WEBP + optimize
        webp: {
            quality: 89
        },

        // PNG optimization
        png: {
            quality: 89
        },

        // JPG optimization
        jpg: {
            quality: 91
        },
    },
    */

    // Resize settings
    resize: false,

    // Production only settings, overwrites default settings
    production: {
    },

    // Development only settings, overwrites default settings
    development: {
    }
};

exports.tasks = {
    imageSizes: [
        require('./task'),
    ]
};

exports.preprocess = {
    clean: [
        require('./preprocess-config'),
    ]
};


/**
 * Paths relative to the global src and dest folders
 */
exports.paths = {
    imageSizes: {
        'src': 'images',
        'dest': 'assets/images',
    }
};
