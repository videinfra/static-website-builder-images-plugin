const chalk = require('chalk');

module.exports = function logMessage (event, taskName, message) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    console.log('[' + chalk.gray(`${ (hours < 10 ? '0' : '') + hours }:${ (minutes < 10 ? '0' : '') + minutes }:${ (seconds < 10 ? '0' : '') + seconds }`) + '] ' + event + ' \'' + chalk.cyan(taskName) + '\'' + message);
};
