import { Pair } from './types';
import Node from './node';
import _ from 'lodash';
import VirtualPoint from './virtualPoint';

/**
 * Represents an AVL Tree
 */
export default class AVLTree {
    node: Node | null;
    height: number;
    balance: number;

    /**
     * Create an AVL Tree
     *
     * @constructor
     */
    constructor() {
        this.node = null;
        this.height = -1;
        this.balance = 0;
    }

    /**
     * Inserts a node into the tree
     *
     * @param {string} index - The index in the tree
     * @param {VirtualPoint} virtualPoint - the virtual point in the tree node.
     */
    insertNode(index: string, virtualPoint: VirtualPoint) {
        const node = new Node(index, virtualPoint);

        if (_.isNil(this.node)) {
            this.node = node;
            this.node.left = new AVLTree();
            this.node.right = new AVLTree();
        } else if (index < this.node.index) {
            this.node.left.insertNode(index, virtualPoint);
        } else if (index > this.node.index) {
            this.node.right.insertNode(index, virtualPoint);
        }
        this._rebalance();
    }

    /**
     * Removes a node at a specific index from the tree
     *
     * @param {string} index - The index in the tree
     */
    removeNode(index: string) {
        if (!_.isNil(this.node)) {
            if (index === this.node.index) {
                if (_.isNil(this.node.left.node) && _.isNil(this.node.right.node)) {
                    this.node = null;
                } else if (_.isNil(this.node.left.node)) {
                    this.node = this.node.right.node;
                } else if (_.isNil(this.node.right.node)) {
                    this.node = this.node.left.node;
                } else {
                    let successor: Node = this.node.right.node;
                    while (!_.isNil(successor) && !_.isNil(successor.left.node)) {
                        successor = successor.left.node;
                    }
                    if (!_.isNil(successor)) {
                        this.node.index = successor.index;
                        this.node.right.removeNode(successor.index);
                    }
                }
            } else if (index < this.node.index) {
                this.node.left.removeNode(index);
            } else if (index > this.node.index) {
                this.node.right.removeNode(index);
            }
            this._rebalance();
        }
    }

    /**
     * Gets a list of nodes virtual points in the tree
     *
     * @return {VirtualPoint[]} The list of virtual points
     */
    getNodes(): VirtualPoint[] {
        const root = this.node;
        const output: VirtualPoint[] = this._getNodes(root);
        return output;
    }

    /**
     * Performs an in-order traversal of the tree and returns the indexes
     *
     * @return {string[]} A list of indexes in in-order order
     */
    inOrderTraverse(): string[] {
        const root = this.node;
        const output: string[] = this._inOrder(root);
        return output;
    }

    /**
     * Performs a pre-order tranversal of the tree and returns the indexes
     *
     * @return {string[]} A list of indexes in pre-order order
     */
    preOrderTraverse(): string[] {
        const root = this.node;
        const output: string[] = this._preOrder(root);
        return output;
    }

    /**
     * Performs a post-order tranversal of the tree and returns the indexes
     *
     * @return {string[]} A list of indexes in post-order order
     */
    postOrderTraverse(): string[] {
        const root = this.node;
        const output: string[] = this._postOrder(root);
        return output;
    }

    /**
     * Gets Pair the smallest key value or null if it
     * doesn't exist in the tree.
     *
     * @return {Pair | null} The Pair or null
     */
    minPair(): Pair | null {
        if (_.isNil(this.node)) {
            return null;
        }
        let currentNode = this.node;
        while (!_.isNil(currentNode.left.node)) {
            currentNode = currentNode.left.node;
        }
        const pair: Pair = { index: currentNode.index, value: currentNode.virtualPoint };
        return pair;
    }

    /**
     * Retrieves the next node in the tree thta follows
     * the provided key in sorted order.
     *
     * @param {string} index - The index of the node
     * @return {Pair | null} The Pair or null
     */
    nextPair(index: string): Pair | null {
        const node = this._nextPair(this.node, index);
        if (_.isNil(node)) {
            return null;
        }
        const pair: Pair = { index: node.index, value: node.virtualPoint };
        return pair;
    }

    /**
     * Helper method for nextPair()
     *
     * @param {Node} node - The node
     * @param {string} index - The index of the node in the tree
     * @return {Node} The node being searched for
     */
    private _nextPair(node: Node, index: string): Node {
        let after: Node;
        if (_.isNil(node)) {
            return null;
        }
        if (index < node.index) {
            if (node.left) {
                after = this._nextPair(node.left.node, index);
                if (_.isNil(after)) {
                    after = node;
                }
            }
        } else if (index > node.index) {
            if (node.right) {
                after = this._nextPair(node.right.node, index);
            }
        } else if (node.index === index) {
            after = node;
        }
        return after;
    }

    /**
     * Rebalances the tree
     */
    private _rebalance() {
        this._updateHeights();
        this._updateBalances();

        // If balance is < -1 or > 1 then rotations are still necessary to perform
        while (this.balance < -1 || this.balance > 1) {
            // Left subtree is larger than the right subtree to rotate to the left
            if (this.balance > 1) {
                if (this.node.left.balance < 0) {
                    this.node.left._rotateLeft();
                    this._updateHeights();
                    this._updateBalances();
                }
                this._rotateRight();
                this._updateHeights();
                this._updateBalances();
            }
            // Right subtree is greater than the left subtree so rotate to the right
            if (this.balance < -1) {
                if (this.node.right.balance > 0) {
                    this.node.right._rotateRight();
                    this._updateHeights();
                    this._updateBalances();
                }
                this._rotateLeft();
                this._updateHeights();
                this._updateBalances();
            }
        }
    }

    /**
     * Updates the heights of subtrees in the tree.
     */
    private _updateHeights() {
        if (this.node) {
            if (this.node.left) {
                this.node.left._updateHeights();
            }
            if (this.node.right) {
                this.node.right._updateHeights();
            }
            this.height = 1 + Math.max(this.node.left.height, this.node.right.height);
        } else {
            this.height = -1;
        }
    }

    /**
     * Updates the balances of subtrees in the tree
     */
    private _updateBalances() {
        if (this.node) {
            if (this.node.left) {
                this.node.left._updateBalances();
            }
            if (this.node.right) {
                this.node.right._updateBalances();
            }
            this.balance = this.node.left.height - this.node.right.height;
        } else {
            this.balance = 0;
        }
    }

    /**
     * Rotate a subtree to the right
     */
    private _rotateRight() {
        const newRoot = this.node.left.node;
        const newLeftSub = newRoot.right.node;
        const oldRoot = this.node;

        this.node = newRoot;
        oldRoot.left.node = newLeftSub;
        newRoot.right.node = oldRoot;
    }

    /**
     * Rotate a subtree to the left
     */
    private _rotateLeft() {
        const newRoot = this.node.right.node;
        const newLeftSub = newRoot.left.node;
        const oldRoot = this.node;

        this.node = newRoot;
        oldRoot.right.node = newLeftSub;
        newRoot.left.node = oldRoot;
    }

    /**
     * Helper method for postOrder()
     *
     * @param {Node} node - The node
     * @param {string[] | null} output - The output
     * @return {string[]} The nodes
     */
    private _postOrder(node: Node, output: string[] | null = null): string[] {
        if (_.isNil(output)) {
            output = [];
        }
        if (node) {
            this._postOrder(node.left.node);
            this._postOrder(node.right.node);
            output.push(node.virtualPoint.index);
        }
        return output;
    }

    /**
     * Helper method for preOrder()
     *
     * @param {Node} node - The node
     * @param {string[] | null} output - The output
     * @return {string[]} The nodes
     */
    private _preOrder(node: Node, output: string[] | null = null): string[] {
        if (_.isNil(output)) {
            output = [];
        }
        if (node) {
            output.push(node.virtualPoint.index);
            this._preOrder(node.left.node);
            this._preOrder(node.right.node);
        }
        return output;
    }

    /**
     * Helper method for inOrder()
     *
     * @param {Node} node - The node
     * @param {string[] | null} output - The output
     * @return {string[]} The nodes
     */
    private _inOrder(node: Node, output: string[] | null = null): string[] {
        if (_.isNil(output)) {
            output = [];
        }
        if (node) {
            this._inOrder(node.left.node);
            output.push(node.virtualPoint.index);
            this._inOrder(node.right.node);
        }
        return output;
    }

    /**
     * Helper method for getNodes()
     *
     * @param {Node} node - The node
     * @param {VirtualPoint[] | null} output - Array of virtual points
     * @return {VirtualPoint[]} - The virtual points
     */
    private _getNodes(node: Node, output: VirtualPoint[] | null = null): VirtualPoint[] {
        if (_.isNil(output)) {
            output = [];
        }
        if (node) {
            this._getNodes(node.left.node, output);
            output.push(node.virtualPoint);
            this._getNodes(node.right.node, output);
        }
        return output;
    }
}