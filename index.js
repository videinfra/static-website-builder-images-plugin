exports.imageSizes = {
    // Glob list of files, which to ignore, relative to the image source folder
    // see https://gulpjs.com/docs/en/getting-started/explaining-globs/
    ignore: [
    ],

    // Image file extensions
    extensions: ['jpg', 'png'],

    // Image quality, only for JPG images
    quality: 90,

    // Production only settings, overwrites default settings
    production: {
    },

    // Development only settings, overwrites default settings
    development: {
    },
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
