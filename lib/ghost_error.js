class GhostError extends Error {
    /*
    The error thrown if the error is not caused by a
    known exception
    */
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

class GhostNoMoreServersError extends GhostError {
    /*
    The error thrown when no servers in your `node_file` are
    reachable.
    */
    constructor(){
        super('[Error]: All nodes marked as dead: Failed to establish a connection to any servers: (Check your fleet status)');
    }
}

class GhostKeyError extends GhostError {
    /*
    The error thrown when they key passed to a method is not a
    valid string.
    */
    constructor(key) {
        super(`[Error]: ${key} is not of type string`);
    }
}

class GhostUnknownNodeError extends GhostError {
    /*
    The error thrown when a node passed to an SDK meethod is
    not a known GhostDB node
    */
   constructor() {
       super('[Error]: Node is not a known GhostDB node');
   }
}

module.exports = {
    GhostNoMoreServersError,
    GhostKeyError,
    GhostUnknownNodeError,
};