exports.images = false;

exports.imageSizes = {
    // Glob list of files, which to ignore, relative to the image source folder
    // see https://gulpjs.com/docs/en/getting-started/explaining-globs/
    ignore: [
    ],

    // Image file extensions
    extensions: ['jpg', 'png', 'webp', 'gif', 'pdf', 'svg'],

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
        // Skip if image already exists in destination folder
        skipExisting: true,
    },

    // Pool settings
    pool: {
        // Max CPU core usage, by default half of all cores
        maxCPUCores: null,

        // Reset pool after number of images, default is 25
        // Helps if there are memory leaks
        resetPoolAfter: 25,
    }
};

exports.tasks = {
    imageSizes: [
        require('./task'),
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
