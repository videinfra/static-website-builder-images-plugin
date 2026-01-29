import fsPromises from 'fs/promises';
import path from 'path';

/**
 * Copies files
 */
export default class CopyProcessing {
    add(node) {
        const folder = path.dirname(node.targetFileName);

        return fsPromises
            .mkdir(folder, { recursive: true })
            .then(() => {
                return fsPromises
                    .copyFile(node.sourceFileName, node.targetFileName)
                    .then(() => {
                        return { success: [node.targetFileName], failure: [] };
                    })
                    .catch((err) => {
                        return {
                            success: [],
                            failure: [{ fileName: node.targetFileName, error: err }],
                        };
                    });
            })
            .catch((err) => {
                return {
                    success: [],
                    failure: [{ fileName: node.targetFileName, error: err }],
                };
            });
    }
}
