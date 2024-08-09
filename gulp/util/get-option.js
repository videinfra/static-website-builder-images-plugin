/**
 * Returns true if value is either a positive number or a false
 *
 * @param {any} value Value
 * @returns {boolean}
 */
function isNumberOrFalse (value) {
    return (typeof value === 'number' && value > 0) || value === false;
}

/**
 * Returns file format property from configuration
 *
 * @param {object} option Option
 * @param {string} name Property name
 * @param {string} format File format
 * @param {boolean} allowDefault Allow option to be a number
 * @returns {number|boolean|undefined} Property if it exists, false if property is false or undefined if property option wasn't found
 */
function getOptionProperty (option, name, format, allowDefault = true) {
    if (option) {
        if (typeof option === 'number') {
            return allowDefault ? option : undefined;
        } else if (name in option) {
            // Old format
            if (isNumberOrFalse(option[name])) {
                return option[name];
            } else if (format in option[name] && isNumberOrFalse(option[name][format])) {
                return option[name][format];
            }
        } else if (format in option) {
            if (isNumberOrFalse(option[format])) {
                // New format
                return allowDefault ? option[format] : undefined;
            } else if (option[format] && isNumberOrFalse(option[format][name])) {
                // Old format
                return option[format][name];
            }
        }
    }

    return undefined;
}

/**
 * If property is undefined then try to find it in option for given format
 *
 * @param {number|boolean|undefined} value Property
 * @param {object} option Option
 * @param {string} name Property name
 * @param {string} format File format
 * @param {boolean} allowDefault Allow option to be a number
 * @returns {number|boolean|undefined} Property if it exists, false if property is false or undefined
 */
function getOptionFallback (value, option, name, format, allowDefault = true) {
    if (value === undefined) {
        return getOptionProperty(option, name, format, allowDefault) || false;
    } else {
        return value || false;
    }
}

module.exports = {
    isNumberOrFalse,
    getOptionProperty,
    getOptionFallback
};
