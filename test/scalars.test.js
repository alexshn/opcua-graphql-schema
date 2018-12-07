const { expect } = require("chai");
const { parseValue } = require("graphql");
const { NodeId, NodeIdType } = require("node-opcua-nodeid");
const { typeDefs, resolvers } = require("../src/scalars.js");


describe("Scalars", function() {

  describe("NodeId", function() {
    // Serialize
    it("should serialize NodeId to string", function() {
      const value = resolvers.NodeId.serialize(new NodeId(NodeIdType.NUMERIC, 1234, 0));
      expect(value).to.be.a('string');
      expect(value).to.equal("ns=0;i=1234");
    });

    // Parse value
    it("should parse value with NodeId as string", function() {
      const value = resolvers.NodeId.parseValue("ns=1;i=123");
      expect(value).to.be.an.instanceof(NodeId);
      expect(value.identifierType).to.equal(NodeIdType.NUMERIC);
      expect(value.namespace).to.equal(1);
      expect(value.value).to.equal(123);
    });

    it("should parse value with NodeId as symbolic name", function() {
      const value = resolvers.NodeId.parseValue("ObjectsFolder");
      expect(value).to.be.an.instanceof(NodeId);
      expect(value.identifierType).to.equal(NodeIdType.NUMERIC);
      expect(value.namespace).to.equal(0);
      expect(value.value).to.equal(85);
    });

    it("should throw if not a string passed to parseValue", function() {
      const emsg = "NodeId must be a string";
      expect(() => resolvers.NodeId.parseValue({})).to.throw(emsg);
      expect(() => resolvers.NodeId.parseValue(10)).to.throw(emsg);
      expect(() => resolvers.NodeId.parseValue(10.0)).to.throw(emsg);
      expect(() => resolvers.NodeId.parseValue(true)).to.throw(emsg);
    });

    it("should throw if not a valid string passed to parseValue", function() {
      // Do not check error message since it's from node-opcua
      expect(() => resolvers.NodeId.parseValue("invalid")).to.throw();
      expect(() => resolvers.NodeId.parseValue("ns=0")).to.throw();
    });

    // Parse literal
    it("should parse literal with NodeId as string", function() {
      const value = resolvers.NodeId.parseLiteral(parseValue('"ns=1;s=TestNodeId"'));
      expect(value).to.be.an.instanceof(NodeId);
      expect(value.identifierType).to.equal(NodeIdType.STRING);
      expect(value.namespace).to.equal(1);
      expect(value.value).to.equal("TestNodeId");
    });

    it("should parse literal with NodeId as symbolic name", function() {
      const value = resolvers.NodeId.parseLiteral(parseValue('"ObjectsFolder"'));
      expect(value).to.be.an.instanceof(NodeId);
      expect(value.identifierType).to.equal(NodeIdType.NUMERIC);
      expect(value.namespace).to.equal(0);
      expect(value.value).to.equal(85);
    });

    it("should throw if not a string passed to parseLiteral", function() {
      const emsg = "NodeId must be a string";
      expect(() => resolvers.NodeId.parseLiteral(parseValue("{}"))).to.throw(emsg);
      expect(() => resolvers.NodeId.parseLiteral(parseValue("10"))).to.throw(emsg);
      expect(() => resolvers.NodeId.parseLiteral(parseValue("10.0"))).to.throw(emsg);
      expect(() => resolvers.NodeId.parseLiteral(parseValue("true"))).to.throw(emsg);
    });

    it("should throw if not a valid string passed to parseLiteral", function() {
      // Do not check error message since it's from node-opcua
      expect(() => resolvers.NodeId.parseLiteral(parseValue('"invalid"'))).to.throw();
      expect(() => resolvers.NodeId.parseLiteral(parseValue('"ns=0"'))).to.throw();
    });
  });
  
});
