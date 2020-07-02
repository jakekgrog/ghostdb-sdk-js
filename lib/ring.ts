import { VirtualPointParams, Pair } from './types';
import * as CRC32 from 'crc-32';
import _ from 'lodash';
import * as fs from 'fs';
import AVLTree from './avlTree';
import VirtualPoint from './virtualPoint';



export default class Ring {
    private UTF_8_ENCODING = 'utf8';
    private CONFIG_EMPTY_ERROR = 'Config file is empty';

    replicas: number;
    ring: AVLTree;

    constructor(nodeConfig: string, replicas: number = 1) {
        this.replicas = replicas ? replicas : 1;
        this.ring = new AVLTree();
        this._initRing(nodeConfig);
    }

    /**
     * Add a node to the ring
     *
     * @param {string} node - A nodes IP address
     */
    add(node: string) {
        for (let i = 0; i < this.replicas; i++) {
            const index: string = this._keyHash(node, i);
            const virtualPointParams: VirtualPointParams = {node, index}
            const virtualPoint = new VirtualPoint(virtualPointParams);
            this.ring.insertNode(index, virtualPoint);
        }
    }

    /**
     * Delete a node from the ring
     *
     * @param {string} node - A nodes IP address
     */
    delete(node: string) {
        let index: string;
        for (let i = 0; i < this.replicas; i++) {
            index = this._keyHash(node, i);
            this.ring.removeNode(index);
        }
    }

    getPoint(key: string): Pair | null {
        const ringSize: number = this.ring.inOrderTraverse().length;
        if (ringSize === 0) {
            return null;
        }
        const index = this._keyHash(key);
        let node = this.ring.nextPair(index);
        if (_.isNil(node)) {
            node = this.ring.minPair();
        }
        return node;
    }

    getPoints(): VirtualPoint[] {
        return this.ring.getNodes();
    }

    /**
     * Initialize the Ring from a config file
     *
     * @param {string} configFile - Name of file containing nodes in the cluster
     */
    private _initRing(configFile: string) {
        if (!_.isNil(configFile)) {
            const configSettings = fs.readFileSync(configFile, "utf-8");
            const nodes: string[] = configSettings.split('\n');
            if (nodes.length !== 0) {
                nodes.forEach((node: string) => {
                    this.add(node.trim());
                });
            } else {
                throw new Error(this.CONFIG_EMPTY_ERROR);
            }
        }
    }

    /**
     * UNSAFE_keyHash
     *
     * @param {string} key - A key
     * @param {number} index - Index if replicas exist
     * @return {string} The hash of the key
     */
    private _keyHash(key: string, index: number = null): string {
        if (index) {
            key = `${key}:${index}`;
        }
        // @ts-ignore
        var s = CRC32.str(key) >>> 0;
        return s.toString(16);
    }
}