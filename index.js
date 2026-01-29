import * as imagesTask from './task.js';
import * as preprocessImagesConfig from './preprocess-config.js';

// Disable regular 'images' plugin
export const images = false;

export const imageSizes = {
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
        // Converting from PNG, JPG or AVIF into WEBP + optimize
        webp: {
            quality: 89,
            effort: 4,
        },

        // Converting from PNG, JPG or WEBP into AVIF + optimize
        avif: {
            quality: 89,
            effort: 2,
        },

        // PNG optimization
        png: {
            quality: 89,
            effort: 4,
        },

        // JPG optimization
        jpg: {
            quality: 91,
            effort: 4,
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

export const tasks = {
    imageSizes: [
        imagesTask,
    ]
};

export const preprocess = {
    clean: [
        preprocessImagesConfig,
    ]
};


/**
 * Paths relative to the global src and dest folders
 */
export const paths = {
    imageSizes: {
        'src': 'images',
        'dest': 'assets/images',
    }
};