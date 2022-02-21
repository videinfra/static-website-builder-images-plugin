[npm-url]: https://npmjs.org/package/@videinfra/static-website-builder-images-plugin
[npm-image]: http://img.shields.io/npm/v/@videinfra/static-website-builder-images-plugin.svg
[npm-parent]: https://www.npmjs.com/package/@videinfra/static-website-builder

[![NPM version][npm-image]][npm-url]

`static-website-builder-images-plugin` is a plugin for [static-website-builder][npm-parent]

## Features

- [x] Converts jpg and png images into webp format
- [x] Optimize images
- [x] Resize and crop images

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
In the config file (eg. `config/config.js`) add:

```js
exports.imageSizes = {
    // Glob list of files, which to ignore, relative to the image source folder
    // see https://gulpjs.com/docs/en/getting-started/explaining-globs/
    ignore: [
    ],

    // Image file extensions
    extensions: ['jpg', 'png', 'webp', 'gif', 'pdf', 'svg'],

    // Optimization settings + format conversion
    // Default is `false`, images won't be converted into WEBP and won't be optimized
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

    // Resize settings
    // Default is `false`, images won't be resized
    resize: {
        // glob: { config }
        '/media/test/*.*': {
            // postfix: { size settings }

            // resize to specific size, crop if aspect ratio changes
            '@xs': { width: 100, height: 100 },

            // resize to specific size, when croping uses 'position' as a center point around which
            // to crop the image: [0.5, 0.5] == center (default), [0, 0] == left top corner
            '@md': { width: 100, height: 100, position: [0.5, 0.5] },

            // resize to specific width; aspect ratio is preserved
            '@lg': { width: 300 },

            // resize to specific height; aspect ratio is preserved
            '@xl': { height: 500 },
        },
    },

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
