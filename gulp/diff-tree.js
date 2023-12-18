const fs = require('fs');
const uniq = require('lodash/uniq');
const find = require('lodash/find');

// Each node is:
// {
//     // Source image file name and hash
//     sourceFileName: '',
//     sourceHash: '',
//
//     // Target image file name
//     targetFileName: '',
//
//     // Encoding and resize options
//     encode: { png: { quality: 70 }, jpg: { quality: 70 }, webp: { quality: 70 }, avif: { quality: 70 }},
//     resize: { width: 700, minHeight: 400, maxHeight: 600 },
// }


class DiffTree {
    constructor (options) {
        this.cacheFileName = options.cache;
        this.src = options.src;
        this.dest = options.dest;

        // List of nodes
        this.tree = this.loadCache() || [];

        // Timer to delay cacheSave
        this.saveTimer = null;

        // List of initial target filename nodes
        // Used to keep track of files which should be removed after all source files has
        // been processed, eg. if sourcee file wasn't processed, then old targetFileName is not
        // removed and we can itterate over them and remove them
        this.oldTargetFileNames = this.tree.map((node) => node.targetFileName);
    }

    /**
     * Load cache from file
     * @protected
     */
    loadCache () {
        try {
            // Add source and destination paths so that file names are absolute
            const content = fs.readFileSync(this.cacheFileName, { encoding: 'utf8' });
            return JSON.parse(content).map((node) => {
                node.sourceFileName = this.src + node.sourceFileName;
                node.targetFileName = this.dest + node.targetFileName;
                return node;
            });
        } catch (err) {
            return null;
        }
    }

    /**
     * Save cache, delayed
     * @protected
     */
    saveCacheDelayed () {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(this.saveCache.bind(this), 1000);
    }

    /**
     * Save cache to file
     * @protected
     */
    saveCache () {
        clearTimeout(this.saveTimer);

        // Remove source and destination paths so that file names are relative
        const cache = this.tree.map((node) => {
            return Object.assign({}, node, {
                sourceFileName: node.sourceFileName.replace(this.src, ''),
                targetFileName: node.targetFileName.replace(this.dest, ''),
            });
        });

        fs.writeFile(this.cacheFileName, JSON.stringify(cache), (err) => {
            if (err) {
                console.error(err);
            }
        });
    }

    /**
     * Patch tree
     *
     * @param {array} nodes List of nodes
     */
    patch (nodes) {
        const commands = [];

        if (nodes.length) {
            const sourceFileNames = uniq(nodes.map((node) => node.sourceFileName));

            // Remove from old target filename list
            // If for given sourceFile doesn't exist new node then 'delete' command is added
            // below
            nodes.forEach((node) => {
                this.oldTargetFileNames = this.oldTargetFileNames.filter((targetFileName) => {
                    return node.targetFileName !== targetFileName;
                });
            });

            sourceFileNames.forEach((sourceFileName) => {
                // Find which nodes were added and which removed
                const oldNodes = this.tree.filter((node) => node.sourceFileName === sourceFileName);
                const newNodes = nodes.filter((node) => node.sourceFileName === sourceFileName);

                // Add to newNodes same sourceSize as for oldNodes
                if (oldNodes.length && 'sourceSize' in oldNodes[0]) {
                    newNodes.forEach((node) => {
                        node.sourceSize = oldNodes[0].sourceSize;
                    });
                }

                // Find nodes which needs to be added or removed
                const addNodes = newNodes.filter((node) => {
                    return !find(oldNodes, node);
                });
                const removeNodes = oldNodes.filter((node) => {
                    return !find(newNodes, node);
                });

                // Remove old ones and add new ones
                this.tree = this.tree.filter((node) => node.sourceFileName !== sourceFileName);
                this.tree = this.tree.concat(newNodes);

                // Add commands
                addNodes.forEach((node) => {
                    if (node.copy) {
                        // Copy file, don't resize and don't convert format and don't optimize
                        commands.push({
                            command: 'copy',
                            node: node
                        });
                    } else if (node.resize) {
                        // Resize + optimize + optionally convert format
                        commands.push({
                            command: 'resize',
                            node: node
                        });
                    } else {
                        // Optimize + optionally convert format
                        commands.push({
                            command: 'convert',
                            node: node
                        });
                    }
                });
                removeNodes.forEach((node) => {
                    // Remove file
                    commands.push({
                        command: 'delete',
                        node: node
                    });
                });
            });

            // Sort so that convert is before resize since we can re-use same ingested image
            commands.sort((a, b) => {
                if (a.command === 'convert' && b.command !== 'convert') {
                    return -1;
                } else if (a.command !== 'convert' && b.command === 'convert') {
                    return 1;
                } else {
                    return 0;
                }
            });

            if (!global.production) {
                this.saveCacheDelayed();
            }
        }

        return commands;
    }

    /**
     * Finalize tree patching
     */
    finalize () {
        const commands = [];

        this.oldTargetFileNames.forEach((targetFileName) => {
            // Remove from tree
            this.tree = this.tree.filter((node) => {
                if (node.targetFileName === targetFileName) {
                    // Add commands
                    commands.push({
                        command: 'delete',
                        node: node
                    });

                    return false;
                } else {
                    return true;
                }
            });
        });

        this.oldTargetFileNames = [];
        this.saveCache();

        return commands;
    }
}

module.exports = DiffTree;
