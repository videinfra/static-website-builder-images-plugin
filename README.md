[npm-url]: https://npmjs.org/package/@videinfra/static-website-builder-images-plugin
[npm-image]: http://img.shields.io/npm/v/@videinfra/static-website-builder-images-plugin.svg
[npm-parent]: https://www.npmjs.com/package/@videinfra/static-website-builder

[![NPM version][npm-image]][npm-url]

`static-website-builder-images-plugin` is a plugin for [static-website-builder][npm-parent]

## Features

- [x] Converts jpg, png, webp and avig images into webp and avif format
- [x] Optimize images
- [x] Resize and crop images
- [x] Regenerate only images which have changed

## Installing

```
npm install @videinfra/static-website-builder-images-plugin --save
```

In the config file (eg. `config/config.js`) add:

```js
exports.plugins = [
    require('@videinfra/static-website-builder-images-plugin'),
];
```

## Configuration

Optional.  
In the config file (eg. `config/config.js`) overwrite default settings:

```js
exports.imageSizes = {
    // Glob list of files, which to ignore, relative to the image source folder
    // see https://gulpjs.com/docs/en/getting-started/explaining-globs/
    ignore: [
    ],

    // Image file extensions, these are defaults
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'svg', 'avif', 'tiff'],

    // Optimization settings + format conversion
    // Default is `false`, images won't be converted into WEBP, won't be optimized and won't be resized
    optimization: {
        // Converting from PNG, JPG or AVIF into WEBP + optimize
        webp: {
            quality: 89,
            effort: 4,
        },

        // Converting from PNG, JPG or WEBP into AVIF + optimize
        // `false` disables converting to format
        avif: false,

        // PNG optimization
        png: 89,

        // JPG optimization
        jpg: 91,
    },

    // Set optimization settings for specific file without resizing
    // Overwrites optimization settings
    // Default is `false`
    convert: {
        // glob: { config }
        // Use different quality for specific images
        '/media/test-quality-1/*.*': { webp: 99 },

        // Convert to format which disabled in optimizations, optionally set effort
        '/media/test-quality-2/*.*': { avif: 99, effort: 2 },
    },

    // Resize settings
    // Default is `false`, images won't be resized
    // 'optimization' must be enabled for resize to work
    resize: {
        // glob: { config }
        '/media/test/*.*': {
            // postfix: { size settings }

            // resize to specific size, crop if aspect ratio changes
            '@xs': { width: 100, height: 100 },

            // resize to specific size, when croping uses 'position' as a center point around which
            // to crop the image: [x, y], eg. [0.5, 0.5] == center (default), [0, 0] == left top corner, [1, 1] == right bottom corner
            '@md': { width: 100, height: 100, position: [0.5, 0.5] },

            // resize to specific width; aspect ratio is preserved
            '@lg': { width: 300 },

            // resize to specific height; aspect ratio is preserved
            '@xl': { height: 500 },

            // resize to at given width or height so that other dimension is larger than constraint; aspect ratio is preserved
            '@xxl': { minWidth: 800, minHeight: 800 },

            // resize to at given width or height so that other dimension is small than constraint; aspect ratio is preserved
            '@xxl-small': { maxWidth: 800, maxHeight: 800 },

            // resize and output also in format which was disabled in 'optimization', if in 'optimization' format exists then
            // quality specified here is used
            '@xxl-other': { maxWidth: 800, maxHeight: 800, quality: { avif: 90 } },

            // resize and output also in format which was disabled in 'optimization', if in 'optimization' format exists then
            // quality specified here is used
            '@xxl-other-faster': { maxWidth: 800, maxHeight: 800, quality: { avif: 90, effort: 2 } },
        },
    },

    // File name of the JSON file which will be used to cache information about
    // generated images, it's used to re-generate only images which changed.
    // This is default value
    cacheFileName: 'cache.json',

    // Production only settings, overwrites default settings
    production: {
    },

    // Development only settings, overwrites default settings
    development: {
    },
}
```


[npm-url]: https://npmjs.org/package/@videinfra/static-website-builder-images-plugin
[npm-image]: http://img.shields.io/npm/v/@videinfra/static-website-builder-images-plugin.svg
[npm-parent]: https://www.npmjs.com/package/@videinfra/static-website-builder
