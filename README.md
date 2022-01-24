[npm-url]: https://npmjs.org/package/@videinfra/static-website-builder-images-plugin
[npm-image]: http://img.shields.io/npm/v/@videinfra/static-website-builder-images-plugin.svg
[npm-parent]: https://www.npmjs.com/package/@videinfra/static-website-builder

[![NPM version][npm-image]][npm-url]

`static-website-builder-images-plugin` is a plugin for [static-website-builder][npm-parent]

## Features

- [x] Converts jpg and png images into webp format
- [ ] Configuration per file
- [ ] Resize and crop images

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
    extensions: ['jpg', 'png'],

    // Image quality, only for JPG images
    quality: 90,

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
