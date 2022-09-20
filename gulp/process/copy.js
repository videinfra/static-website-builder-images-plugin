const fsPromises = require('fs').promises;
const path = require('path');

/**
 * Copies files
 */
class CopyProcessing {
    add (node) {
        const folder = path.dirname(node.targetFileName);

        return fsPromises.mkdir(folder, { recursive: true })
            .then(() => {
                return fsPromises.copyFile(node.sourceFileName, node.targetFileName)
                    .then(() => {
                        return {success: [node.targetFileName], failure: []};
                    })
                    .catch((err) => {
                        return {
                            success: [],
                            failure: [{ fileName: node.targetFileName, error: err }]
                        };
                    });
            })
            .catch((err) => {
                return {
                    success: [],
                    failure: [{ fileName: node.targetFileName, error: err }]
                };
            });
    }
}

module.exports = CopyProcessing;
