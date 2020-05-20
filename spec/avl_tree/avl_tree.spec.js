var AVLTree = require('../../lib/avl_tree');
var VirtualPoint = require('../../lib/virtual_point');

describe("AVLTree,", function () {

  //Demonstrates insertion & re-balancing of nodes
  describe("Insertion (Keys Only)", () => {
    it("checks root insert.", () => {
      const Tree = new AVLTree();
      Tree.insertNode(20);
      expect(Tree.node.key).toEqual(20);
    });
    it("checks less than insert.", () => {
      const Tree = new AVLTree();
      Tree.insertNode(20);
      Tree.insertNode(10);
      expect(Tree.node.left.node.key).toEqual(10);
    });
    it("re-balances through left rotation", () => {
      const Tree = new AVLTree();
      Tree.insertNode(20);
      Tree.insertNode(10);
      Tree.insertNode(5);
      expect(Tree.node.key).toEqual(10);
    });
    it("re-balances through right rotation", () => {
      const Tree = new AVLTree();
      Tree.insertNode(20);
      Tree.insertNode(10);
      Tree.insertNode(5);
      Tree.insertNode(30);
      Tree.insertNode(40);
      expect(Tree.node.right.node.key).toEqual(30);
    });
  });

  describe("Deletion (Keys Only)", () => {
    it("Delete Leaf", () => {
      const Tree = new AVLTree();
      Tree.insertNode(20);
      Tree.insertNode(10);
      Tree.removeNode(10);
      expect(Tree.node.key).toEqual(20);
    });

    it("Delete Root", () => {
      const Tree = new AVLTree();
      Tree.insertNode(20);
      Tree.insertNode(10);
      Tree.removeNode(20);
      expect(Tree.node.key).toEqual(10);
    });

    it("Delete node with two children", () => {
      const Tree = new AVLTree();
      Tree.insertNode(20);
      Tree.insertNode(10);
      Tree.insertNode(5);
      Tree.insertNode(15);
      Tree.removeNode(10);
      expect(Tree.node.key).toEqual(15);
    });
  });

  //Demonstrates different tree traversal methods
  describe("Traversal,", () => {
    const Tree = new AVLTree();
    var point;

    point = new VirtualPoint("10.128.20.1", 20);
    Tree.insertNode(20, point);

    point = new VirtualPoint("10.128.20.2", 4);
    Tree.insertNode(4, point);

    point = new VirtualPoint("10.128.20.3", 3);
    Tree.insertNode(3, point);

    point = new VirtualPoint("10.128.20.4", 9);
    Tree.insertNode(9, point);

    point = new VirtualPoint("10.128.20.5", 10);
    Tree.insertNode(10, point);

    point = new VirtualPoint("10.128.20.6", 15);
    Tree.insertNode(15, point);

    it("checks inOrder traversal", () => {
      var keys = Tree.inOrderTraverse();
      var expectedOrder = [3, 4, 9, 10, 15, 20];
      expect(keys).toEqual(expectedOrder);
    });

    it("checks preOrder traversal", () => {
      var keys = Tree.preOrderTraverse();
      var expectedOrder = [10, 4, 3, 9, 20, 15];
      expect(keys).toEqual(expectedOrder);
    });

    it("checks inOrder traversal", () => {
      var keys = Tree.postOrderTraverse();
      var expectedOrder = [3, 9, 4, 15, 20, 10];
      expect(keys).toEqual(expectedOrder);
    });
  });

  describe("get min or next node", () => {
    const Tree = new AVLTree();
    var point;

    point = new VirtualPoint("10.128.20.1", 20);
    Tree.insertNode(20, point);

    point = new VirtualPoint("10.128.20.2", 4);
    Tree.insertNode(4, point);

    point = new VirtualPoint("10.128.20.3", 3);
    Tree.insertNode(3, point);

    point = new VirtualPoint("10.128.20.4", 9);
    Tree.insertNode(9, point);

    point = new VirtualPoint("10.128.20.5", 10);
    Tree.insertNode(10, point);

    point = new VirtualPoint("10.128.20.6", 15);
    Tree.insertNode(15, point);

    it("gets the smallest pair", () => {
      const node = Tree.minPair();
      expect(node.key).toEqual(3);
    });

    it("gets the next pair", () => {
      const node = Tree.nextPair(11);
      expect(node.key).toEqual(15);
    })
  });
});
