/**
 * Returns true if value is either a positive number or a false
 * 
 * @param {any} quality Quality
 * @returns {boolean}
 */
function isNumberOrFalse (quality) {
    return (typeof quality === 'number' && quality > 0) || quality === false;
}

/**
 * Returns file format quality from configuration
 * 
 * @param {object} option Option
 * @param {string} format File format
 * @returns {number|boolean|undefined} Quality if it exists, false if quality is false or undefined if quality option wasn't found
 */
function getQuality (option, format) {
    if (option) {
        if (typeof option === 'number') {
            return option;
        } else if ('quality' in option) {
            // Old format
            if (isNumberOrFalse(option.quality)) {
                return option.quality;
            } else if (format in option.quality && isNumberOrFalse(option.quality[format])) {
                return option.quality[format];
            }
        } else if (format in option) {
            if (isNumberOrFalse(option[format])) {
                // New format
                return option[format];
            } else if (option[format] && isNumberOrFalse(option[format].quality)) {
                // Old format
                return option[format].quality;
            }
        }
    }

    return undefined;
}

/**
 * If quality is undefined then try to find it in option for given format
 * 
 * @param {number|boolean|undefined} quality Quality
 * @param {object} option Option
 * @param {string} format File format
 * @returns {number|boolean|undefined} Quality if it exists, false if quality is false or undefined
 */
function qualityFallback (quality, option, format) {
    if (quality === undefined) {
        return getQuality(option, format) || false;
    } else {
        return quality || false;
    }
}

module.exports = {
    isNumberOrFalse,
    getQuality,
    qualityFallback
}