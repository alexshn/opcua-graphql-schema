const { expect } = require("chai");
const parseGQLValue = require("graphql").parseValue;
const { NodeId, NodeIdType } = require("node-opcua-nodeid");
const { QualifiedName, LocalizedText } = require("node-opcua-data-model");
const { typeDefs, resolvers } = require("../src/scalars.js");


describe("Scalars", function() {

  describe("TypeDefs", function() {
    it("should have only expected definitions", function() {
      typeDefs.definitions.map(def => {
        expect(def.kind).to.be.oneOf(["ScalarTypeDefinition"]);
      });
    });

    it("should define only known scalars", function() {
      const scalars = typeDefs.definitions.map(def => def.name.value);
      expect(scalars).to.have.members([
        "NodeId",
        "QualifiedName",
        "LocalizedText",
        "SByte",
        "Int16",
        "Int32",
        "Byte",
        "UInt16",
        "UInt32",
        "Float",
        "Double",
        "Variant"
      ]);
    });
  });

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
    });

    it("should throw if not a valid string passed to parseValue", function() {
      // Do not check error message since it's from node-opcua
      expect(() => resolvers.NodeId.parseValue("invalid")).to.throw();
      expect(() => resolvers.NodeId.parseValue("ns=0")).to.throw();
    });

    // Parse literal
    it("should parse literal with NodeId as string", function() {
      const value = resolvers.NodeId.parseLiteral(parseGQLValue('"ns=1;s=TestNodeId"'));
      expect(value).to.be.an.instanceof(NodeId);
      expect(value.identifierType).to.equal(NodeIdType.STRING);
      expect(value.namespace).to.equal(1);
      expect(value.value).to.equal("TestNodeId");
    });

    it("should parse literal with NodeId as symbolic name", function() {
      const value = resolvers.NodeId.parseLiteral(parseGQLValue('"ObjectsFolder"'));
      expect(value).to.be.an.instanceof(NodeId);
      expect(value.identifierType).to.equal(NodeIdType.NUMERIC);
      expect(value.namespace).to.equal(0);
      expect(value.value).to.equal(85);
    });

    it("should throw if not a string passed to parseLiteral", function() {
      const emsg = "NodeId must be a string";
      expect(() => resolvers.NodeId.parseLiteral(parseGQLValue("{}"))).to.throw(emsg);
      expect(() => resolvers.NodeId.parseLiteral(parseGQLValue("10"))).to.throw(emsg);
    });

    it("should throw if not a valid string passed to parseLiteral", function() {
      // Do not check error message since it's from node-opcua
      expect(() => resolvers.NodeId.parseLiteral(parseGQLValue('"invalid"'))).to.throw();
      expect(() => resolvers.NodeId.parseLiteral(parseGQLValue('"ns=0"'))).to.throw();
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
    });

    // Parse literal
    it("should parse literal with QualifiedName as string", function() {
      const value = resolvers.QualifiedName.parseLiteral(parseGQLValue('"1:SomeName"'));
      expect(value).to.be.an.instanceof(QualifiedName);
      expect(value.namespaceIndex).to.equal(1);
      expect(value.name).to.equal("SomeName");
    });

    it("should parse literal with QualifiedName as string (no namespace)", function() {
      const value = resolvers.QualifiedName.parseLiteral(parseGQLValue('"NoNamespace"'));
      expect(value).to.be.an.instanceof(QualifiedName);
      expect(value.namespaceIndex).to.equal(0);
      expect(value.name).to.equal("NoNamespace");
    });

    it("should throw if not a string passed to parseLiteral", function() {
      const emsg = "QualifiedName must be a string";
      expect(() => resolvers.QualifiedName.parseLiteral(parseGQLValue("{}"))).to.throw(emsg);
      expect(() => resolvers.QualifiedName.parseLiteral(parseGQLValue("10"))).to.throw(emsg);
    });
  });


  describe("LocalizedText", function() {
    // serialize
    it("should serialize LocalizedText to Object", function() {
      const value = resolvers.LocalizedText.serialize(new LocalizedText({
        locale: "en-US", text: "Some localized text"
      }));
      expect(value).to.be.a('string');
      expect(value).to.equal("Some localized text");
    });

    // parseValue
    it("should parse value with LocalizedText as a string", function() {
      const value = resolvers.LocalizedText.parseValue("Localized test text");
      expect(value).to.be.an.instanceof(LocalizedText);
      expect(value.locale).to.be.null;
      expect(value.text).to.equal("Localized test text");
    });

    it("should throw if not a valid value passed to parseValue", function() {
      const emsg = "LocalizedText must be a string";
      expect(() => resolvers.LocalizedText.parseValue(10)).to.throw(emsg);
      expect(() => resolvers.LocalizedText.parseValue({locale: "EN"})).to.throw(emsg);
    });

    // parseLiteral
    it("should parse literal with LocalizedText as a string", function() {
      const value = resolvers.LocalizedText.parseLiteral(parseGQLValue('"Localized test text"'));
      expect(value).to.be.an.instanceof(LocalizedText);
      expect(value.locale).to.be.null;
      expect(value.text).to.equal("Localized test text");
    });

    it("should throw if not a valid value passed to parseLiteral", function() {
      const emsg = "LocalizedText must be a string";
      expect(() => resolvers.LocalizedText.parseLiteral(parseGQLValue('10'))).to.throw(emsg);
      expect(() => resolvers.LocalizedText.parseLiteral(parseGQLValue('{locale: "EN"}'))).to.throw(emsg);
    });
  });


  describe("SByte", function() {
    it("should serialize and parse SByte", function() {
      expect(resolvers.SByte.serialize(-20)).to.equal(-20);
      expect(resolvers.SByte.parseValue(-128)).to.equal(-128);
      expect(resolvers.SByte.parseLiteral(parseGQLValue('127'))).to.equal(127);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "SByte must be an integer between -128 and 127";
      expect(() => resolvers.SByte.parseValue(1000)).to.throw(emsg);
      expect(() => resolvers.SByte.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.SByte.parseLiteral(parseGQLValue('-1000'))).to.throw(emsg);
      expect(() => resolvers.SByte.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Int16", function() {
    it("should serialize and parse Int16", function() {
      expect(resolvers.Int16.serialize(-2000)).to.equal(-2000);
      expect(resolvers.Int16.parseValue(-32768)).to.equal(-32768);
      expect(resolvers.Int16.parseLiteral(parseGQLValue('32767'))).to.equal(32767);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "Int16 must be an integer between -32768 and 32767";
      expect(() => resolvers.Int16.parseValue(32769)).to.throw(emsg);
      expect(() => resolvers.Int16.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.Int16.parseLiteral(parseGQLValue('-32769'))).to.throw(emsg);
      expect(() => resolvers.Int16.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Int32", function() {
    it("should serialize and parse Int32", function() {
      expect(resolvers.Int32.serialize(-2000000)).to.equal(-2000000);
      expect(resolvers.Int32.parseValue(-2147483648)).to.equal(-2147483648);
      expect(resolvers.Int32.parseLiteral(parseGQLValue('2147483647'))).to.equal(2147483647);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "Int32 must be an integer between -2147483648 and 2147483647";
      expect(() => resolvers.Int32.parseValue(2147483649)).to.throw(emsg);
      expect(() => resolvers.Int32.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.Int32.parseLiteral(parseGQLValue('-2147483649'))).to.throw(emsg);
      expect(() => resolvers.Int32.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Byte", function() {
    it("should serialize and parse Byte", function() {
      expect(resolvers.Byte.serialize(20)).to.equal(20);
      expect(resolvers.Byte.parseValue(0)).to.equal(0);
      expect(resolvers.Byte.parseLiteral(parseGQLValue('255'))).to.equal(255);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "Byte must be an integer between 0 and 255";
      expect(() => resolvers.Byte.parseValue(1000)).to.throw(emsg);
      expect(() => resolvers.Byte.parseValue("text")).to.throw(emsg);
      expect(() => resolvers.Byte.parseLiteral(parseGQLValue('-1000'))).to.throw(emsg);
      expect(() => resolvers.Byte.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("UInt16", function() {
    it("should serialize and parse UInt16", function() {
      expect(resolvers.UInt16.serialize(2000)).to.equal(2000);
      expect(resolvers.UInt16.parseValue(0)).to.equal(0);
      expect(resolvers.UInt16.parseLiteral(parseGQLValue('65535'))).to.equal(65535);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "UInt16 must be an integer between 0 and 65535";
      expect(() => resolvers.UInt16.parseValue(65536)).to.throw(emsg);
      expect(() => resolvers.UInt16.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.UInt16.parseLiteral(parseGQLValue('-1'))).to.throw(emsg);
      expect(() => resolvers.UInt16.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("UInt32", function() {
    it("should serialize and parse UInt32", function() {
      expect(resolvers.UInt32.serialize(2000000)).to.equal(2000000);
      expect(resolvers.UInt32.parseValue(0)).to.equal(0);
      expect(resolvers.UInt32.parseLiteral(parseGQLValue('4294967295'))).to.equal(4294967295);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "UInt32 must be an integer between 0 and 4294967295";
      expect(() => resolvers.UInt32.parseValue(4294967296)).to.throw(emsg);
      expect(() => resolvers.UInt32.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.UInt32.parseLiteral(parseGQLValue('-1'))).to.throw(emsg);
      expect(() => resolvers.UInt32.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Float", function() {
    it("should serialize and parse Float", function() {
      expect(resolvers.Float.serialize(200.01)).to.equal(200.01);
      expect(resolvers.Float.parseValue(0)).to.equal(0);
      expect(resolvers.Float.parseLiteral(parseGQLValue('0.1234'))).to.equal(0.1234);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "Float must be a number";
      expect(() => resolvers.Float.parseLiteral(parseGQLValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.Float.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Double", function() {
    it("should serialize and parse Double", function() {
      expect(resolvers.Double.serialize(200.01)).to.equal(200.01);
      expect(resolvers.Double.parseValue(0)).to.equal(0);
      expect(resolvers.Double.parseLiteral(parseGQLValue('0.1234'))).to.equal(0.1234);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "Double must be a number";
      expect(() => resolvers.Double.parseLiteral(parseGQLValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.Double.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Variant", function() {
    it("should parse Variant to JSON", function() {
      // TODO: implement tests for Variant scalar
    });
  });

});
