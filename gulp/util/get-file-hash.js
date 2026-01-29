import fs from 'fs';
import crypto from 'crypto';
import chalk from 'chalk';

export default function getFileHash(fileName) {
    return new Promise((resolve, reject) => {
        try {
            const stream = fs.createReadStream(fileName);
            const hash = crypto.createHash('sha1');

            stream.on('data', (data) => hash.update(data));
            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });
        } catch (err) {
            console.log(chalk.redBright(`Failed to load "${fileName}" hash`));
            console.error(err);
            reject();
        }
    });
}
