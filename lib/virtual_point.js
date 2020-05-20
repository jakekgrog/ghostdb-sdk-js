class VirtualPoint{
    /*
    Virtual Point represents a point of a GhostDB cache on the hash ring
    */
    constructor(node, index){
        this.node = node;
        this.index = index;
    }
}

module.exports = VirtualPoint;