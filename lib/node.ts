import _ from 'lodash';
import VirtualPoint from './virtualPoint';
import AVLTree from './avlTree';

export default class Node {
    index: string;
    virtualPoint: VirtualPoint;
    left: AVLTree | null;
    right: AVLTree | null;

    constructor(index: string, virtualPoint: VirtualPoint) {
        this.index = index;
        this.virtualPoint = virtualPoint;
        this.left = null;
        this.right = null;
    }
}