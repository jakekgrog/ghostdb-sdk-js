var Ring = require('./ring');
const { GhostNoMoreServersError, GhostKeyError } = require('./ghost_error');
var _ = require('lodash');
const request = require('request-promise');

var _DeadServers = new Set();
const _ReviveWait = 30;
const _APIEndpoints = {
    "ping": "/ping",
    "put": "/put",
    "get": "/get",
    "add": "/add",
    "delete": "/delete",
    "flush": "/flush",
    "getSnitchMetrics": "/getSnitchMetrics",
    "getWatchdogMetrics": "/getWatchdogMetrics",
    "ping": "/ping"
};

class Cache {
    /*
    The `Cache` object that provides an interface between GhostDB nodes

    You must supply a `node_file`. This is the file that contains the
    IP addresses of all servers in your fleet. You can update this file
    as needed. Any changes to this file will automatically be picked up
    by the `Cache` object.

    If `http` is not supplied then `http` defaults to `True`.
    If your fleet requires communication over `HTTPS`, then pass `False`.

    If you do not supply the `port` your GhostDB fleet is configured
    to, then it defaults to the standard port of `7991`.
    */
    constructor(configFilePath, http = true, port = 7991) {
        this.configFilePath = configFilePath;
        this.ring = new Ring(configFilePath);
        this.protocol = ((http) ? 'http://' : 'https://');
        this.port = port.toString();
        setInterval(this._serverRevive.bind(this), _ReviveWait * 1000);
    }

    /*
    The `get()` method will fetch a value for a given key.
    The `key` parameter is a string
    */
    async get(key) {
        if (key instanceof String) {
            throw new GhostKeyError(key);
        }

        var node = this.ring.getPoint(key);

        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        const options = {
            method: "POST",
            url: this.protocol + node.value.node + ':' + this.port + _APIEndpoints["get"],
            json: true,
            body: {
                Key: key
            }
        }

        return await request(options)
            .catch(() => {
                _DeadServers.add(node.value.node);
                console.log("DeadServers: " + _DeadServers);
                this.ring.delete(node.value.node);
                return this.get(key);
            });
    };

    /*
    The `add()` method will add a key/value pair into the
    cache only if the `key` does not pre-exist in the cache.

    The `key` parameter must be a string

    The `value` parameter can be of whatever type you want
    as long as it is JSON serializable

    If the key/value pair is successully added, the `STORED`
    message will be returned. Otherwise the `NOT_STORED` message
    will be returned.
    */
    async add(key, value, ttl = -1) {
        if ((key instanceof String)) {
            throw new GhostKeyError(key);
        }

        var node = this.ring.getPoint(key);

        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        const options = {
            method: "POST",
            url: this.protocol + node.value.node + ':' + this.port + _APIEndpoints["add"],
            json: true,
            body: {
                "Key": key,
                "Value": value,
                "TTL": ttl
            },
        }
        return await request(options)
            .catch(() => {
                _DeadServers.add(node.value.node);
                console.log("DeadServers: " + _DeadServers);
                this.ring.delete(node.value.node);
                return this.add(key, value);
            });
    };

    /*
    The `put()` method will add a key/value pair into the 
    cache. If the `key` already exists in the cache, it's value
    will be overwritten.

    The `key` parameter must be a string

    The `value` parameter can be of whatever type you want as 
    long as it is JSON serializable.

    If the key/value pair is successully added, the `STORED`
    message will be returned. Otherwise the `NOT_STORED` message
    will be returned.
    */
    async put(key, value, ttl = -1) {
        if ((key instanceof String)) {
            throw new GhostKeyError(key);
        }
        var node = this.ring.getPoint(key);
        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        const options = {
            method: "POST",
            url: this.protocol + node.value.node + ':' + this.port + _APIEndpoints["put"],
            json: true,
            body: {
                "Key": key,
                "Value": value,
                "TTL": ttl
            },
        }
        return await request(options)
            .catch(() => {
                _DeadServers.add(node.value.node);
                console.log("DeadServers: " + _DeadServers);
                this.ring.delete(node.value.node);
                return this.put(key, value);
            });
    };

    /*
    The `delete()` method will remove a key/value pair
    from the cache specified by the `key` parameter

    The `key` parameter must be a string

    If the key/value pair is successfully deleted, 
    the `REMOVED` message will be returned, otherwise
    the `NOT_FOUND` message will be returned
    */
    async delete(key) {
        if (key instanceof String) {
            throw new GhostKeyError(key);
        }

        var node = this.ring.getPoint(key);

        if (_.isNil(node)) {
            throw new GhostNoMoreServersError();
        }

        const options = {
            method: "POST",
            url: this.protocol + node.value.node + ':' + this.port + _APIEndpoints["delete"],
            json: true,
            body: {
                "Key": key,
            },
        }
        return await request(options)
            .catch(() => {
                _DeadServers.add(node.value.node);
                console.log("DeadServers: " + _DeadServers);
                this.ring.delete(node.value.node);
                return this.delete(key);
            });
    };

    /*
    The `flush()` method will delete all key/value
    pairs from all nodes specified in the `node_file`
    at the time of flushing.
    */
    async flush() {
        var nodes = this.ring.getPoints();
        if (nodes.length == 0) {
            return "Flush Failed: Currently no nodes";
        }
        nodes.forEach(node => {
            var address = this.protocol + node.node + ':' + this.port + _APIEndpoints["flush"];
            return request.get(address)
                .catch((err) => {
                    _DeadServers.add(node.node);
                    console.log("DeadServers: " + _DeadServers);
                    this.ring.delete(node.node);
                    return this.flush();
                });
        });
    };

    /*
    The `flushNode()` method will delete all key/value
    pairs from the specified node.
    */
    async flushNode(server) {
        var nodes = this.ring.getPoints();
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].node == server) {
                var address = this.protocol + nodes[i].node + ':' + this.port + _APIEndpoints["flush"];
                console.log(nodes[i].node);
                return request.get(address)
                    .catch((err) => {
                        console.log(err);
                        _DeadServers.add(nodes[i].node);
                        console.log("DeadServers: " + _DeadServers);
                        this.ring.delete(nodes[i].node);
                        return {"Message" : "ERR_FLUSH"}
                    });
           }
        };
   }

    /*
    The `getSnitchMetrics()` method will fetch all
    snitch metricsfrom all nodes specified in the
    `node_file` at the time of calling.
    */
    async getSnitchMetrics(metrics=null, visitedNodes=null) {
        if (_.isNull(metrics)) {
            metrics = [];
        }
        if (_.isNull(visitedNodes)) {
            visitedNodes = [];
        }

        var nodes = this.ring.getPoints();

        for (var i = 0; i < nodes.length; i++) {
            if (!visitedNodes.includes(nodes[i].node)) {
                var address = this.protocol + nodes[i].node + ":" + this.port + _APIEndpoints["getSnitchMetrics"];
                await request.get(address)
                    .then(data => {
                        metrics.push({node: nodes[i].node, metrics: data});
                        visitedNodes.push(nodes[i].node);
                    })
                    .catch(err => {
                        _DeadServers.add(nodes[i].node);
                        console.log("DeadServers: " + _DeadServers);
                        this.ring.delete(nodes[i].node);
                        visitedNodes.push(nodes[i].node);
                        this.getSnitchMetrics(metrics, visitedNodes);
                    });
            }
        };
        return metrics;
    }

    /*
    The `getWatchdogMetrics()` method will fetch all
    application metrics from all nodes specified in the
    `node_file` at the time of calling.
    */
    async getWatchdogMetrics(metrics=null, visitedNodes=null) {
        if (_.isNull(metrics)) {
            metrics = [];
        }
        if (_.isNull(visitedNodes)) {
            visitedNodes = [];
        }

        var nodes = this.ring.getPoints();

        for(var i = 0; i < nodes.length; i++) {
            if (!visitedNodes.includes(nodes[i].node)) {
                var address = this.protocol + nodes[i].node + ":" + this.port + _APIEndpoints["getWatchdogMetrics"];
                await request.get(address)
                    .then(data => {
                        metrics.push({node: nodes[i].node, metrics: data});
                        visitedNodes.push(nodes[i].node);
                    })
                    .catch(err => {
                        _DeadServers.add(nodes[i].node);
                        console.log("DeadServers: "+ _DeadServers);
                        this.ring.delete(nodes[i].node);
                        visitedNodes.push(nodes[i].node);
                        return this.getWatchdogMetrics(metrics, visitedNodes);
                    });
            }
        };
        return metrics;
    }

    async ping(liveNodes=null, visitedNodes=null) {
        if (_.isNil(liveNodes)) {
            liveNodes = [];
        }

        if (_.isNil(visitedNodes)) {
            visitedNodes = [];
        }

        var nodes = this.ring.getPoints();

        for (var i = 0; i < nodes.length; i++) {
            if (!visitedNodes.includes(nodes[i].node)) {
                var address = this.protocol + nodes[i].node + ":" + this.port + _APIEndpoints["ping"];
                await request.get(address, {timeout: 1500})
                    .on('response', data => {
                        if (data.statusCode == 200) {
                            liveNodes.push(nodes[i].node);
                        }
                        visitedNodes.push(nodes[i].node);
                    })
                    .catch(err => {
                        _DeadServers.add(nodes[i].node);
                        console.log("DeadServers: " + _DeadServers);
                        this.ring.delete(nodes[i].node);
                        return this.ping(liveNodes, visitedNodes);
                    });
            }
        };
        return liveNodes;
    }

    _serverRevive() {
        for (let server of _DeadServers) {
            console.log("Checking server: " + server);
            const options = {
                method: "GET",
                url: this.protocol + server + ':' + this.port + _APIEndpoints["ping"],
                resolveWithFullResponse: true
            }

            request(options)
                .then(res => {
                    if (res.statusCode == 200) {
                        this.ring.add(server);
                        _DeadServers.delete(server);
                    }
                })
                .catch(function (error) {
                    console.log(error)
                })
        }
    };
};

module.exports = Cache;