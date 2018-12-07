const { expect } = require("chai");
const { parseValue } = require("graphql");
const { NodeId, NodeIdType } = require("node-opcua-nodeid");
const { QualifiedName } = require("node-opcua-data-model");
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


  describe("QualifiedName", function() {
    // serialize
    it("should serialize QualifiedName to string", function() {
      const value = resolvers.QualifiedName.serialize(new QualifiedName({
        namespaceIndex: 1, name: "TestName"
      }));
      expect(value).to.be.a('string');
      expect(value).to.equal("1:TestName");
    });

    it("should serialize QualifiedName to string (no namespace)", function() {
      const value = resolvers.QualifiedName.serialize(new QualifiedName({
        namespaceIndex: 0, name: "TestName"
      }));
      expect(value).to.be.a('string');
      expect(value).to.equal("TestName");
    });

    // Parse value
    it("should parse value with QualifiedName as a string", function() {
      const value = resolvers.QualifiedName.parseValue("1:SomeName");
      expect(value).to.be.an.instanceof(QualifiedName);
      expect(value.namespaceIndex).to.equal(1);
      expect(value.name).to.equal("SomeName");
    });

    it("should parse value with QualifiedName as string (no namespace)", function() {
      const value = resolvers.QualifiedName.parseValue("NoNamespace");
      expect(value).to.be.an.instanceof(QualifiedName);
      expect(value.namespaceIndex).to.equal(0);
      expect(value.name).to.equal("NoNamespace");
    });

    it("should throw if not a string passed to parseValue", function() {
      const emsg = "QualifiedName must be a string";
      expect(() => resolvers.QualifiedName.parseValue({})).to.throw(emsg);
      expect(() => resolvers.QualifiedName.parseValue(10)).to.throw(emsg);
      expect(() => resolvers.QualifiedName.parseValue(10.0)).to.throw(emsg);
      expect(() => resolvers.QualifiedName.parseValue(true)).to.throw(emsg);
    });

    // Parse literal
    it("should parse literal with QualifiedName as string", function() {
      const value = resolvers.QualifiedName.parseLiteral(parseValue('"1:SomeName"'));
      expect(value).to.be.an.instanceof(QualifiedName);
      expect(value.namespaceIndex).to.equal(1);
      expect(value.name).to.equal("SomeName");
    });

    it("should parse literal with QualifiedName as string (no namespace)", function() {
      const value = resolvers.QualifiedName.parseLiteral(parseValue('"NoNamespace"'));
      expect(value).to.be.an.instanceof(QualifiedName);
      expect(value.namespaceIndex).to.equal(0);
      expect(value.name).to.equal("NoNamespace");
    });

    it("should throw if not a string passed to parseLiteral", function() {
      const emsg = "QualifiedName must be a string";
      expect(() => resolvers.QualifiedName.parseLiteral(parseValue("{}"))).to.throw(emsg);
      expect(() => resolvers.QualifiedName.parseLiteral(parseValue("10"))).to.throw(emsg);
      expect(() => resolvers.QualifiedName.parseLiteral(parseValue("10.0"))).to.throw(emsg);
      expect(() => resolvers.QualifiedName.parseLiteral(parseValue("true"))).to.throw(emsg);
    });
  });

});
