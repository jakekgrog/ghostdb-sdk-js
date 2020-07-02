import { CacheRequestParams } from './types';

export default class GhostObject {
    Key: string;
    Value: any;
    TTL: number;

    constructor(params: CacheRequestParams) {
        this.Key = params.key ? params.key : "";
        this.Value = params.value ? params.value : null;
        this.TTL = params.ttl ? params.ttl : -1;
    }

    toJSON = (): any => {
        return {
            Key: this.Key,
            Value: this.Value,
            TTL: this.TTL,
        };
    }
}