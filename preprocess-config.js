import { getDestPath } from '@videinfra/static-website-builder/lib/get-path.js';
import globs from '@videinfra/static-website-builder/lib/globs-helper.js';

/**
 * Modify configuration
 *
 * @param {object} config Images plugin configuration
 * @param {object} fullConfig Full configuration
 * @returns {object} Transformed images plugin configuration
 */
export default function preprocessCleanConfig(config = {}, fullConfig) {
    if (config && fullConfig.clean) {
        // Add exception for images and folder to the 'clean' patterns to prevent
        // images from being removed
        const destPath = fullConfig.paths.imageSizes.dest.replace(/^\//, '').replace(/\/$/, '');
        const patterns = [];

        // Don't remove images, it takes long time to re-generate them
        patterns.push('!' + destPath + '/**/*.*');

        // Don't remove folders, otherwise when removing folder it will remove also
        // images
        destPath.split('/').forEach((_value, index, arr) => {
            patterns.unshift('!' + arr.slice(0, arr.length - index).join('/'));
        });

        // Generate glob patterns and normalize paths to absolute
        fullConfig.clean.patterns = fullConfig.clean.patterns || [];

        globs
            .paths(getDestPath())
            .paths(patterns)
            .generate()
            .forEach((pattern) => {
                fullConfig.clean.patterns.push(pattern);
            });
    }

    return config;
}
