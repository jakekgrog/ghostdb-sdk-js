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
    'getSysMetrics': '/getSysMetrics',
    'getAppMetrics': '/getAppMetrics',
    'nodeSize': '/nodeSize',
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

        return await this._makeServiceRequest("get", node, { key }).catch(() => {
            this._markDead(node);
            return this.get(key);
        });
    }

    /**
     * Gets the number of entries in the cache of a given node
     * 
     * @param {string} ip - The IP address of the node
     * @return {Promise<RequestPromise>} The promise
     */
    async nodeSize(ip: string): Promise<RequestPromise> {
        const node: Pair = this.ring.getPoint(ip);
        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        return await this._makeServiceRequest("nodeSize", node, { ip }).catch(() => {
            this._markDead(node);
            return this.get(ip);
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
        const node: Pair = this._getNode(key);
        return await this._makeServiceRequest("add", node, { key, value, ttl }).catch(() => {
            this._markDead(node);
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
        const node: Pair = this._getNode(key);
        return await this._makeServiceRequest("put", node, { key, value, ttl }).catch(() => {
            this._markDead(node);
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
        const node = this._getNode(key);
        return await this._makeServiceRequest("delete", node, { key }).catch(() => {
            this._markDead(node);
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
        const nodes: VirtualPoint[] = this._getNodes();
        nodes.forEach(node => {
            const pairNode = node.toPair();
            return this._makeServiceRequest("flush", pairNode, {}).catch(() => {
                this._markDead(pairNode);
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
    async getSysMetrics(metrics: any = null, visitedNodes: any = null): Promise<RequestPromise> {
        if (_.isNil(metrics)) {
            metrics = [];
        }
        if (_.isNil(visitedNodes)) {
            visitedNodes = [];
        }

        const nodes = this._getNodes();

        for (let i = 0; i < nodes.length; i++) {
            const pairNode: Pair = nodes[i].toPair();
            if (!visitedNodes.includes(pairNode.value.ip)) {
                await this._makeServiceRequest("getSysMetrics", pairNode, {})
                    .then((data: any) => {
                        metrics.push({ node: pairNode.value.ip, metrics: data });
                        visitedNodes.push(pairNode.value.ip);
                    }).catch((err: Error) => {
                        this._markDead(pairNode);
                        return this.getSysMetrics(metrics, visitedNodes);
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
    async getAppMetrics(metrics: any = null, visitedNodes: any = null): Promise<RequestPromise> {
        if (_.isNil(metrics)) {
            metrics = [];
        }
        if (_.isNil(visitedNodes)) {
            visitedNodes = [];
        }

        const nodes = this._getNodes();

        for (let i = 0; i < nodes.length; i++) {
            const pairNode: Pair = nodes[i].toPair();
            if (!visitedNodes.includes(pairNode.value.ip)) {
                await this._makeServiceRequest("getAppMetrics", pairNode, {})
                    .then((data: any) => {
                        metrics.push({ node: pairNode.value.ip, metrics: data });
                        visitedNodes.push(pairNode.value.ip);
                    }).catch((err: Error) => {
                        this._markDead(pairNode);
                        return this.getAppMetrics(metrics, visitedNodes);
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

        for (let i = 0; i < nodes.length; i++) {
            const pairNode: Pair = nodes[i].toPair();
            if (!visitedNodes.includes(pairNode.value.ip)) {
                await this._makeServiceRequest("ping", pairNode, {}) .then((data: any) => {
                    liveNodes.push({ node: pairNode.value.ip, liveNodes: data });
                    visitedNodes.push(pairNode.value.ip);
                }).catch((err: Error) => {
                    this._markDead(pairNode);
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
    private _serverRevive() {
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

    private _buildOptionsForRequest(endpoint: string, node: Pair, requestObj: CacheRequest): any {
        return {
            method: "POST",
            url: this.protocol + node.value.ip + ':' + this.port + API_ENDPOINTS[endpoint],
            json: true,
            body: requestObj.toJSON(),
        };
    }

    private _markDead(server: Pair) {
        this.deadServers.add(server.value.ip);
        this.ring.delete(server.value.ip);
    }

    private _getNode(key: string): Pair {
        const node: Pair = this.ring.getPoint(key);
        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }
        return node;
    }

    private _getNodes(): VirtualPoint[] {
        const nodes: VirtualPoint[] = this.ring.getPoints();
        if (nodes.length == 0) {
            throw new GhostNoMoreServersError();
        }
        return nodes;
    }

    private async _makeServiceRequest(requestType: string, server: Pair, params: any): Promise<RequestPromise> {
        const requestObject: CacheRequest = buildCacheRequestObj(params);
        const options = this._buildOptionsForRequest(requestType, server, requestObject);
        return await request.post(options);
    }
}

export default Cache;
