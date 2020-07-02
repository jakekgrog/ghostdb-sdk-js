import { CacheRequestParams } from './types';
import GhostObject from './gobj';

export default class CacheRequest {
    Gobj: GhostObject;

    constructor(params: CacheRequestParams) {
        this.Gobj = new GhostObject(params);
    }
    
    toJSON = (): any => {
        return {
            Gobj: this.Gobj.toJSON()
        };
    }
}

export const buildCacheRequestObj = (args: any): CacheRequest => {
    const requestParams: CacheRequestParams = {
        key: args.key,
        value: args.value,
        ttl: args.ttl
    };
    return new CacheRequest(requestParams);
}