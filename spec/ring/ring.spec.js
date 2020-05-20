var Ring = require('../../lib/ring');

describe("Ring", () => {

    it("manually adds a node", () => {
        const hashRing = new Ring();
        hashRing.add("10.23.20.2");         // Hash Key - 0xd80ceccd
        hashRing.add("10.23.34.4");         // Hash Key - 0x8eda8641
        const key1 = "ATestingKey";         // Hash Key - 0x2269b0e
        const key2 = "AnotherTestingKey";   // Hash Key - 0xd3918bd2

        var node = hashRing.getPoint(key1);
        expect(node.value.node).toEqual("10.23.34.4");

        node = hashRing.getPoint(key2);
        expect(node.value.node).toEqual("10.23.20.2");
    });

    it("deletes a node", () => {
        const hashRing = new Ring();

        hashRing.add("10.23.20.2");         // Hash Key - 0xd80ceccd
        hashRing.add("10.23.34.4");         // Hash Key - 0x8eda8641
        const key1 = "ATestingKey";         // Hash Key - 0x2269b0e
        const key2 = "AnotherTestingKey";   // Hash Key - 0xd3918bd2

        hashRing.delete("10.23.20.2");
        var node1 = hashRing.getPoint(key1);
        var node2 = hashRing.getPoint(key2);

        expect(node1.value.node).toEqual("10.23.34.4");
        expect(node2.value.node).toEqual("10.23.34.4");
    });

    it("adds a node from config", () => {
        const hashRing = new Ring('./lib/ghostdb_test.conf');
        const nodes = hashRing.getPoints();
        expect(nodes[0].index).toEqual('89879968');
        expect(nodes[1].index).toEqual('d7b7e7a8');
    })
});
