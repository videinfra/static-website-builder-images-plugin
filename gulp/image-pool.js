const ImagePool = require('@squoosh/lib').ImagePool;


/**
 * Image pool manager resets image pool after cetrain number of
 * processed images
 */
class ImagePoolManager {
    constructor (config) {
        this.config = config;

        this.cpuCount = config.cpuCount;
        this.parallelCount = config.parallelCount;
        this.resetPoolAfter = config.resetPoolAfter || 25; // Reset poll after 25 images

        this.imagePool = null;
        this.queue = [];
        this.processed = 0;
        this.processing = 0;
        this.isResetting = false;
    }

    getImagePool () {
        return new Promise((resolve) => {
            this.queue.push(resolve);
            this.next()
        });
    }

    next () {
        if (!this.isResetting && this.queue.length && this.processing < this.parallelCount) {
            if (this.processed + this.processing < this.resetPoolAfter) {
                this.processing++;

                const resolve = this.queue[0];
                this.queue.splice(0, 1);

                this.imagePool = this.imagePool || new ImagePool(this.cpuCount);
                resolve(this.imagePool);
            } else if (this.processed === this.resetPoolAfter) {
                this.resetPool();
            }
        }
    }

    nextMax () {
        for (let i = 0; i < this.parallelCount; i++) {
            this.next();
        }
    }

    resetPool () {
        if (this.imagePool) {
            this.isResetting = true;

            if (this.config.onReset) {
                this.config.onReset();
            }

            this.imagePool.close().then(() => {
                delete(this.imagePool);
                this.imagePool = null;
                this.processed = 0;
                this.isResetting = false;
                this.nextMax();
            })
        } else {
            this.nextMax();
        }
    }

    markComplete () {
        this.processing--;
        this.processed++;

        if (this.queue.length) {
            this.next();
        } else if (!this.processing) {
            this.resetPool();
        }
    }
}

module.exports = ImagePoolManager;
