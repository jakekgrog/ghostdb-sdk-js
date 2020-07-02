import VirtualPoint from './virtualPoint';

export type CacheRequestParams = {
    key?: string;
    value?: any;
    ttl?: number;
}

export type VirtualPointParams = {
    node: string;
    index: string;
}

export type RingParams = {
    nodeConfig?: string;
    replicas?: number;
}

export type Pair = {
    index: string;
    value: VirtualPoint;
}
