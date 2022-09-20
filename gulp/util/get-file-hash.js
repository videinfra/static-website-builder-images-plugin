const fs = require('fs');
const crypto = require('crypto');
const chalk = require('chalk');

module.exports = function getFileHash (fileName) {
    return new Promise((resolve, reject) => {
        try {
            const stream = fs.createReadStream(fileName);
            const hash = crypto.createHash('sha1');

            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });
        } catch (err) {
            console.log(chalk.redBright(`Failed to load "${ fileName }" hash`));
            console.error(err);
            reject();
        }
    });
};
