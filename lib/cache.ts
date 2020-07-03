import _ from 'lodash';
import * as request from 'request-promise';
import { RequestPromiseOptions, RequestPromise } from 'request-promise';
import Ring from './ring';
import VirtualPoint from './virtualPoint';
import CacheRequest, { buildCacheRequestObj } from './cacheRequest';
import {
    GhostNoMoreServersError,
    GhostKeyError,
} from './GhostError';
import { Pair } from './types';

const HTTP: string = 'http://';
const HTTPS: string = 'https://';

const REVIVE_WAIT: number = 30;

const API_ENDPOINTS: Record<string, string> = {
    'ping': '/ping',
    'put': '/put',
    'get': '/get',
    'add': '/add',
    'delete': '/delete',
    'flush': '/flush',
    'getSnitchMetrics': '/getSnitchMetrics',
    'getWatchdogMetrics': '/getWatchdogMetrics',
};

class Cache {
    /** The set of temporarily unreacable servers */
    private deadServers: Set<string>;

    private configFilepath: string;
    private ring: Ring;
    private protocol: string;
    private port: string;

    /**
     * Build a new cache object
     * 
     * @param {string} configFilepath - The path to the file containing IPs of nodes
     * @param {boolean} http - Should protocol be http or https
     * @param {number} port - The port the cluster is running on
     */
    constructor(configFilepath: string, http: boolean = true, port: number = 7991) {
        this.configFilepath = configFilepath;
        this.ring = new Ring(this.configFilepath);
        this.protocol = http ? HTTP : HTTPS;
        this.port = port.toString();

        this.deadServers = new Set<string>();

        setInterval(this._serverRevive.bind(this), REVIVE_WAIT * 1000);
    }

    /**
     * Get an entry from the cache
     *
     * @param {string} key - The key to fetch value for
     * @return {Promise<RequestPromise>} The promise.
     */
    async get(key: string): Promise<RequestPromise> {
        const node: Pair = this.ring.getPoint(key);
        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        const requestObject: CacheRequest = buildCacheRequestObj({ key });
        const options = this._buildOptionsForRequest("get", node, requestObject);
        return await request.post(options).catch(() => {
            this.deadServers.add(node.value.ip);
            this.ring.delete(node.value.ip);
            return this.get(key);
        });
    }

    /**
     * Add an entry into the cache only if there does not
     * exist an entry for the key.
     *
     * @param {string} key - The key
     * @param {any} value - The value
     * @param {number} ttl - The time-to-live
     * @return {Promise<RequestPromise>} The promise.
     */
    async add(key: string, value: any, ttl: number = -1): Promise<RequestPromise> {
        const node: Pair = this.ring.getPoint(key);
        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        const requestObject: CacheRequest = buildCacheRequestObj({ key, value, ttl });
        const options = this._buildOptionsForRequest("add", node, requestObject);
        return await request.post(options).catch(() => {
            this.deadServers.add(node.value.ip);
            this.ring.delete(node.value.ip);
            return this.add(key, value, ttl);
        });
    }

    /**
     * Add an entry into the cache. If the key already
     * exists in the cache, then it's value will be
     * overwritten.
     * 
     * @param {string} key - The key
     * @param {any} value  - The value
     * @param {number} ttl - The time-to-live
     * @return {Promise<RequestPromise>} The promise.
     */
    async put(key: string, value: any, ttl: number = -1): Promise<RequestPromise> {
        const node: Pair = this.ring.getPoint(key);
        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        const requestObject: CacheRequest = buildCacheRequestObj({ key, value, ttl });
        const options = this._buildOptionsForRequest("put", node, requestObject);
        return await request.post(options).catch(() => {
            this.deadServers.add(node.value.ip);
            this.ring.delete(node.value.ip);
            return this.put(key, value, ttl);
        });
    }

    /**
     * Deletes an entry with the given key from the cache.
     *
     * @param {string} key - The key
     * @return {Promise<RequestPromise>} The promise.
     */
    async delete(key): Promise<RequestPromise> {
        const node = this.ring.getPoint(key);
        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        const requestObject: CacheRequest = buildCacheRequestObj({ key });
        const options = this._buildOptionsForRequest("delete", node, requestObject);
        return await request.post(options).catch(() => {
            this.deadServers.add(node.value.ip);
            this.ring.delete(node.value.ip);
            return this.delete(key);
        });
    }

    /**
     * Deletes all entries from all nodes specified
     * in the node configuration file at the time
     * of flushing.
     * 
     * @return {Promise<RequestPromise>} The promise.
     */
    async flush(): Promise<RequestPromise> {
        const nodes: VirtualPoint[] = this.ring.getPoints();
        if (nodes.length == 0) {
            throw new GhostNoMoreServersError();
        }

        nodes.forEach(node => {
            const pairNode = node.toPair();
            const requestObject: CacheRequest = buildCacheRequestObj({});
            const options = this._buildOptionsForRequest("flush", pairNode, requestObject);
            return request.post(options).catch(() => {
                this.deadServers.add(pairNode.value.ip);
                return this.flush();
            });
        });
    }

    /**
     * Gets system level metrics from each node in the
     * cache cluster
     *
     * @param {any} metrics - Metric results
     * @param {string[]} visitedNodes - The visited nodes
     * @return {Promise<RequsetPromise>} Promise response
     */
    async getSnitchMetrics(metrics: any = null, visitedNodes: any = null): Promise<RequestPromise> {
        if (_.isNil(metrics)) {
            metrics = [];
        }
        if (_.isNil(visitedNodes)) {
            visitedNodes = [];
        }

        const nodes = this.ring.getPoints();

        for (var i = 0; i < nodes.length; i++) {
            const pairNode: Pair = nodes[i].toPair();
            if (!visitedNodes.includes(nodes[i].ip)) {
                const requestObject: CacheRequest = buildCacheRequestObj({});
                const options = this._buildOptionsForRequest("getSnitchMetrics", pairNode, requestObject);
                await request.post(options).then((data: any) => {
                    metrics.push({ node: pairNode.value.ip, metrics: data });
                    visitedNodes.push(pairNode.value.ip);
                }).catch((err: Error) => {
                    this.deadServers.add(pairNode.value.ip);
                    return this.getSnitchMetrics(metrics, visitedNodes);
                });
            }
        }
        return metrics;
    }

    /**
     * Gets application level metrics from each node in the
     * cache cluster
     *
     * @param {any} metrics - Metric results
     * @param {stirng[]} visitedNodes - The visited nodes 
     * @return {Promise<RequsetPromise>} Promise response
     */
    async getWatchdogMetrics(metrics: any = null, visitedNodes: any = null): Promise<RequestPromise> {
        if (_.isNil(metrics)) {
            metrics = [];
        }
        if (_.isNil(visitedNodes)) {
            visitedNodes = [];
        }

        const nodes = this.ring.getPoints();

        for (var i = 0; i < nodes.length; i++) {
            const pairNode: Pair = nodes[i].toPair();
            if (!visitedNodes.includes(nodes[i].ip)) {
                const requestObject: CacheRequest = buildCacheRequestObj({});
                const options = this._buildOptionsForRequest("getWatchdogMetrics", pairNode, requestObject);
                await request.post(options).then((data: any) => {
                    metrics.push({ node: pairNode.value.ip, metrics: data });
                    visitedNodes.push(pairNode.value.ip);
                }).catch((err: Error) => {
                    this.deadServers.add(pairNode.value.ip);
                    return this.getWatchdogMetrics(metrics, visitedNodes);
                });
            }
        }
        return metrics;
    }

    /**
     * Pings each node in the cluster to ensuer they are reachable
     *
     * @param {any} liveNodes - Nodes that are reachable
     * @param {string[]} visitedNodes - Nodes visited during pinging
     * @return {Promise<RequsetPromise>} Promise response
     */
    async ping(liveNodes: any = null, visitedNodes: any = null): Promise<RequestPromise> {
        if (_.isNil(liveNodes)) {
            liveNodes = [];
        }
        if (_.isNil(visitedNodes)) {
            visitedNodes = [];
        }

        const nodes = this.ring.getPoints();

        for (var i = 0; i < nodes.length; i++) {
            const pairNode: Pair = nodes[i].toPair();
            if (!visitedNodes.includes(nodes[i].ip)) {
                const requestObject: CacheRequest = buildCacheRequestObj({});
                const options = this._buildOptionsForRequest("ping", pairNode, requestObject);
                await request.post(options).then((data: any) => {
                    liveNodes.push({ node: pairNode.value.ip, liveNodes: data });
                    visitedNodes.push(pairNode.value.ip);
                }).catch((err: Error) => {
                    this.deadServers.add(pairNode.value.ip);
                    return this.ping(liveNodes, visitedNodes);
                });
            }
        }
        return liveNodes;
    }

    /**
     * Periodically polls nodes in the deadServer set. If it gets
     * a response, then it adds it back to the ring.
     */
    _serverRevive() {
        for (let server of this.deadServers) {
            const options = {
                method: "GET",
                url: this.protocol + server + ':' + this.port + API_ENDPOINTS["ping"],
                resolveWithFullResponse: true,
            }
            
            request.post(options).then(res => {
                if (res.statusCode == 200) {
                    this.ring.add(server);
                    this.deadServers.delete(server);
                }
            }).catch(function (error) {
                console.log(error);
            })
        }
    }

    _buildOptionsForRequest(endpoint: string, node: Pair, requestObj: CacheRequest): any {
        return {
            method: "POST",
            url: this.protocol + node.value.ip + ':' + this.port + API_ENDPOINTS[endpoint],
            json: true,
            body: requestObj.toJSON(),
        };
    }
}

export default Cache;
