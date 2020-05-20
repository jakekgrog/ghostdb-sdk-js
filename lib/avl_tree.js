var _ = require('lodash');

class Node {
    constructor(key, virtualPoint) {
        this.key = key;
        this.virtualPoint = virtualPoint;
        this.left = null;
        this.right = null;
    }
}


class AVLTree {
    /*
        The `AVLTree()` object used by the `Ring` object to
        implement the consistent hashing ring. 
    */
    constructor() {
        this.node = null;
        this.height = -1;
        this.balance = 0;
    }

    /*
        The `insertNode()` method inserts a key/value pair into
        the AVL tree.

        The `key` parameter is the hexidecimal representation 
        of the CRC32 hash of the GhostDB node IP address.

        The `vp` parameter is the `VirtualPoint` being inserted
        into the tree.
    */
    insertNode(key, virtualPoint) {
        const node = new Node(key, virtualPoint);

        if (_.isNil(this.node)) {
            this.node = node;
            this.node.left = new AVLTree();
            this.node.right = new AVLTree();
        } else if (key < this.node.key) {
            this.node.left.insertNode(key, virtualPoint);
        } else if (key > this.node.key) {
            this.node.right.insertNode(key, virtualPoint);
        }
        this._reBalance();
    }

    /*
        The `removeNode()` method removes a key/value pair from the
        tree where the `value` is a `VirtualPoint` object.

        The `key` parameter is the hexidecimal representation 
        of the CRC32 hash of the GhostDB node IP address.
    */
    removeNode(key) {
        if (!_.isNil(this.node)) {
            if (this.node.key == key) {

                if (_.isNil(this.node.left.node) && _.isNil(this.node.right.node)) {
                    this.node = null;
                } else if (_.isNil(this.node.left.node)) {
                    this.node = this.node.right.node;
                } else if (_.isNil(this.node.right.node)) {
                    this.node = this.node.left.node;
                } else {
                    let successor = this.node.right.node;
                    while (!_.isNil(successor) && !_._.isNil(successor.left.node)) {
                        successor = successor.left.node;
                    }
                    if (!_.isNil(successor)) {
                        this.node.key = successor.key;
                        this.node.right.removeNode(successor.key);
                    }
                }

            } else if (key < this.node.key) {
                this.node.left.removeNode(key);
            } else if (key > this.node.key) {
                this.node.right.removeNode(key);
            }

            this._reBalance();
        }
    }

    /*
        The `getNodes()` method returns a list of all `VirtualPoint`
        objects in the tree.
    */
    getNodes(){
        var root = this.node;
        function _getNodes(node) {
            if (node) {
                _getNodes(node.left.node);
                output.push(node.virtualPoint);
                _getNodes(node.right.node);
            }
        }
        var output = [];
        _getNodes(root);
        return output;
    }

    /*
        The `inOrderTraverse()` method returns a list of all keys
        in the tree in in-order order
    */
    inOrderTraverse() {
        var root = this.node;
        function _inOrder(node) {
            if (node) {
                _inOrder(node.left.node);
                output.push(node.virtualPoint.index);
                _inOrder(node.right.node);
            }
        }
        var output = [];
        _inOrder(root);
        return output
    }

    /*
        The `preOrderTraverse()` method returns a list of all keys
        in the tree in pre-order order
    */
    preOrderTraverse() {
        var root = this.node;
        function _preOrder(node) {
            if (node) {
                output.push(node.virtualPoint.index);
                _preOrder(node.left.node);
                _preOrder(node.right.node);
            }
        }
        var output = [];
        _preOrder(root);
        return output
    }

    /*
        The `postOrderTraverse()` method returns a list of all keys
        in the tree in post-order order
    */
    postOrderTraverse() {
        var root = this.node;
        function _postOrder(node) {
            if (node) {
                _postOrder(node.left.node);
                _postOrder(node.right.node);
                output.push(node.virtualPoint.index);
            }
        }
        var output = [];
        _postOrder(root);
        return output
    }

    /*
        The `minPair()` method returns the key with the 
        smallest key value.
    */
    minPair() {
        if (_.isNil(this.node)) {
            return null;
        }
        var currNode = this.node;
        while (!_.isNil(currNode.left.node)) {
            currNode = currNode.left.node;
        }
        return { key: currNode.key, value: currNode.virtualPoint };
    }

    /*
        The `nextPair()` method retrieves the next GhostDB 
        node in the tree that follows the provided key in sorted
        order.

        The `key` parameter is the hexidecimal representation 
        of the CRC32 hash of the GhostDB node IP address.
    */
    nextPair(key) {
        var node = this._nextPair(this.node, key);

        if (_.isNil(node)) {
            return null;
        }
        return { key: node.key, value: node.virtualPoint };
    }

    _nextPair(node, key) {
        // Gets the first node with a key greater than provided key
        var after;
        if (_.isNil(node)) {
            return null;
        }
        if (key < node.key) {
            if (node.left) {
                after = this._nextPair(node.left.node, key);
                if (_.isNil(after)) {
                    after = node;
                }
            }
        } else if (key > node.key) {
            if (node.right) {
                after = this._nextPair(node.right.node, key);
            }
        } else if (node.key == key) {
            after = node;
        }
        return after;
    }

    _reBalance() {
        //Update the trees height and balance values
        this._updateHeights();
        this._updateBalances();

        // If balance is < -1 or > 1 then rotations are still necessary to perform
        while (this.balance < -1
            || this.balance > 1) {
            // Left subtree is larger than right subtree so rotate to the left
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
            // Right subtree larger than left subtree so rotate to the right
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

    _updateHeights() {
        // Height is max height of left or right subtrees + 1 for the root
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

    _updateBalances() {
        // Calculate the balance factor of the tree
        // Balance factor calculated as follows:
        //     BF = height(left_subtree) - height(right_subtree)
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

    _rotateRight() {
        // Set self as the right subtree of the left subtree
        let newRoot = this.node.left.node;
        let newLeftSub = newRoot.right.node;
        let oldRoot = this.node;

        this.node = newRoot;
        oldRoot.left.node = newLeftSub;
        newRoot.right.node = oldRoot;
    }

    _rotateLeft() {
        // Set self as the left subtree of the right subtree
        let newRoot = this.node.right.node;
        let newLeftSub = newRoot.left.node;
        let oldRoot = this.node;

        this.node = newRoot;
        oldRoot.right.node = newLeftSub;
        newRoot.left.node = oldRoot;
    }

}

module.exports = AVLTree;