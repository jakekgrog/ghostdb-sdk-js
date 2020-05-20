var CRC32 = require('crc-32');
var _ = require('lodash');
const fs = require('fs');
var AVLTree = require('./avl_tree');
var VirtualPoint = require('./virtual_point');

class Ring {
    /*
    The `Ring` object represents the consistent hashing ring.

    The `node_config` parameter defaults to `None`, however it
    should be provided by the `Cache` object

    The `replicas` parameter adds replicas for a virtual point
    in the tree. This defaults to `1` and it is not recommended
    to change this.
    */
    constructor(nodeConfig = null, replicas = 1) {
        this.replicas = replicas;
        this.ring = new AVLTree();
        if (!_.isNil(nodeConfig)) {
            var configSettings = fs.readFileSync(nodeConfig, 'utf-8');
            var nodes = configSettings.split('\n');
            if (nodes.length != 0) {
                nodes.forEach(node => {
                    this.add(node.trim());
                });
            } else {
                throw new Error('Config file is empty');
            }
        }
    }

    /*
    The `add()` method adds a GhostDB node to the
    consistent hashing ring.
    */
    add(node) {
        for (let i = 0; i < this.replicas; i++) {
            var key = this.keyHash(node, i);
            var vp = new VirtualPoint(node, key);
            this.ring.insertNode(key, vp);
        }
    }

    /*
    The `delete()` method removes a GhostDB node from the
    consistent hashing ring. This is typically performed
    if the GhostDB node is unreachable.
    */
    delete(node) {
        var key;
        for (let i = 0; i < this.replicas; i++) {
            key = this.keyHash(node, i);
            this.ring.removeNode(key);
        }
    }

    /*
    The `getPoint()` method returns the correct 
    GhostDB node to send a request to for a given key.
    */
    getPoint(key) {
        var ringSize = this.ring.inOrderTraverse().length;
        if (ringSize === 0) {
            return null;
        }
        var key = this.keyHash(key);
        var node = this.ring.nextPair(key);
        if (_.isNil(node)) {
            node = this.ring.minPair(key);
        }
        return node;
    }

    /*
    The `get_points()` method returns all GhostDB nodes
    in the consistent hashing ring.
    */
    getPoints() {
        return this.ring.getNodes();
    }

    /*
    The `key_hash()` method generates and returns 
    the unsigned CRC32 hash for a provided key in 
    hexidecimal form.
    */
    keyHash(key, index = null) {
        if (index) {
            key = "{0}:{1}".format(key, index);
        }
        var s = CRC32.str(key) >>> 0;
        return s.toString(16);
    }
}

module.exports = Ring;