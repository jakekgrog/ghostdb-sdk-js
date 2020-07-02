import { VirtualPointParams, Pair } from './types';

/**
 * Represents a virtual point
 */
class VirtualPoint{
    ip: string;
    index: string;

    /**
     * Creates a new virtual point
     *
     * @constructor
     * @param {VirtualPointParams} params - ip and index params 
     */
    constructor(params: VirtualPointParams){
        this.ip = params.node;
        this.index = params.index;
    }

    toPair(): Pair {
        return {
            index: this.index,
            value: this,
        }
    }
}

export default VirtualPoint;
