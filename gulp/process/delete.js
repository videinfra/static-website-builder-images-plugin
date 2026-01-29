import fsPromises from 'fs/promises';

/**
 * Deletes files
 */
export default class DeleteProcessing {
    add(node) {
        const result = { success: [], failure: [] };
        let extensions = [];

        if (node.copy) {
            // In 'copy' command targetFileName includes extension
            extensions = [null];
        } else if (node.encode) {
            // Find extensions from encode options
            extensions = node.encode ? Object.keys(node.encode).filter((name) => !!node.encode[name]) : [];
        }

        const promises = extensions.map((extension) => {
            const fileName = node.targetFileName + (extension ? '.' + extension : '');
            return fsPromises
                .unlink(fileName)
                .then(() => {
                    result.success.push(node.targetFileName);
                })
                .catch((err) => {
                    result.failure.push({ fileName: node.targetFileName, error: err });
                });
        });

        return Promise.all(promises).then(() => {
            return result;
        });
    }
}
