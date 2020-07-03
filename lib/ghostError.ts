/**
 * Generic GhostDB Error
 */
export class GhostError extends Error {
    /**
     * Thrown when a GhostDB SDK specific error
     * is encountered
     *
     * @param {string} message - The message to be displayed
     */
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

/**
 * Thrown when no servers in the cluster are
 * reachable by a cache method
 */
export class GhostNoMoreServersError extends GhostError {
    /**
     * Construct the error
     */
    constructor() {
        super('[Error]: All nodes marked as dead: Failed to establish a connection to any servers: (Check your fleet status)');
    }
}

/**
 * Thrown when key is not of type string
 */
export class GhostKeyError extends GhostError {
    /**
     * Construct the error
     *
     * @param {string} key - The key that is of wrong type
     */
    constructor(key: any) {
        super(`[Error]: ${key} is not of type string`);
    }
}