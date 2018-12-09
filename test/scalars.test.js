const { expect } = require("chai");
const { parseValue } = require("graphql");
const { NodeId, NodeIdType } = require("node-opcua-nodeid");
const { QualifiedName, LocalizedText } = require("node-opcua-data-model");
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


  describe("LocalizedText", function() {
    // serialize
    it("should serialize LocalizedText to Object", function() {
      const value = resolvers.LocalizedText.serialize(new LocalizedText({
        locale: "en-US", text: "Some localized text"
      }));
      expect(value).to.be.an.instanceof(Object);
      expect(value.locale).to.equal("en-US");
      expect(value.text).to.equal("Some localized text");
    });

    // parseValue
    it("should parse value with LocalizedText as a string", function() {
      const value = resolvers.LocalizedText.parseValue("Localized test text");
      expect(value).to.be.an.instanceof(LocalizedText);
      expect(value.locale).to.be.null;
      expect(value.text).to.equal("Localized test text");
    });

    it("should parse value with LocalizedText as Object (with locale)", function() {
      const value = resolvers.LocalizedText.parseValue({locale: "de-DE", text: "TestText"});
      expect(value).to.be.an.instanceof(LocalizedText);
      expect(value.locale).to.equal("de-DE");
      expect(value.text).to.equal("TestText");
    });

    it("should throw if not a valid value passed to parseValue", function() {
      const emsg = "LocalizedText must be a string or Object with locale and text properties";
      expect(() => resolvers.LocalizedText.parseValue(10)).to.throw(emsg);
      expect(() => resolvers.LocalizedText.parseValue({locale: "EN"})).to.throw(emsg);
    });

    // parseLiteral
    it("should parse literal with LocalizedText as a string", function() {
      const value = resolvers.LocalizedText.parseLiteral(parseValue('"Localized test text"'));
      expect(value).to.be.an.instanceof(LocalizedText);
      expect(value.locale).to.be.null;
      expect(value.text).to.equal("Localized test text");
    });

    it("should parse literal with LocalizedText as Object (with locale)", function() {
      const value = resolvers.LocalizedText.parseLiteral(parseValue('{locale: "de-DE", text: "TestText"}'));
      expect(value).to.be.an.instanceof(LocalizedText);
      expect(value.locale).to.equal("de-DE");
      expect(value.text).to.equal("TestText");
    });

    it("should parse literal with LocalizedText as Object (with variables)", function() {
      const value = resolvers.LocalizedText.parseLiteral(
        parseValue('{locale: $localeVar, text: $textVar}'),
        {localeVar: "en-US", textVar: "TestText"}
      );
      expect(value).to.be.an.instanceof(LocalizedText);
      expect(value.locale).to.equal("en-US");
      expect(value.text).to.equal("TestText");
    });

    it("should throw if not a valid value passed to parseLiteral", function() {
      const emsg = "LocalizedText must be a string or Object with locale and text properties";
      expect(() => resolvers.LocalizedText.parseLiteral(parseValue('10'))).to.throw(emsg);
      expect(() => resolvers.LocalizedText.parseLiteral(parseValue('{locale: "EN"}'))).to.throw(emsg);
    });
  });


  describe("SByte", function() {
    it("should serialize and parse SByte", function() {
      expect(resolvers.SByte.serialize(-20)).to.equal(-20);
      expect(resolvers.SByte.parseValue(-128)).to.equal(-128);
      expect(resolvers.SByte.parseLiteral(parseValue('127'))).to.equal(127);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "SByte must be an integer between -128 and 127";
      expect(() => resolvers.SByte.parseValue(1000)).to.throw(emsg);
      expect(() => resolvers.SByte.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.SByte.parseValue({})).to.throw(emsg);
      expect(() => resolvers.SByte.parseLiteral(parseValue('-1000'))).to.throw(emsg);
      expect(() => resolvers.SByte.parseLiteral(parseValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.SByte.parseLiteral(parseValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Int16", function() {
    it("should serialize and parse Int16", function() {
      expect(resolvers.Int16.serialize(-2000)).to.equal(-2000);
      expect(resolvers.Int16.parseValue(-32768)).to.equal(-32768);
      expect(resolvers.Int16.parseLiteral(parseValue('32767'))).to.equal(32767);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "Int16 must be an integer between -32768 and 32767";
      expect(() => resolvers.Int16.parseValue(32769)).to.throw(emsg);
      expect(() => resolvers.Int16.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.Int16.parseValue({})).to.throw(emsg);
      expect(() => resolvers.Int16.parseLiteral(parseValue('-32769'))).to.throw(emsg);
      expect(() => resolvers.Int16.parseLiteral(parseValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.Int16.parseLiteral(parseValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Int32", function() {
    it("should serialize and parse Int32", function() {
      expect(resolvers.Int32.serialize(-2000000)).to.equal(-2000000);
      expect(resolvers.Int32.parseValue(-2147483648)).to.equal(-2147483648);
      expect(resolvers.Int32.parseLiteral(parseValue('2147483647'))).to.equal(2147483647);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "Int32 must be an integer between -2147483648 and 2147483647";
      expect(() => resolvers.Int32.parseValue(2147483649)).to.throw(emsg);
      expect(() => resolvers.Int32.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.Int32.parseValue({})).to.throw(emsg);
      expect(() => resolvers.Int32.parseLiteral(parseValue('-2147483649'))).to.throw(emsg);
      expect(() => resolvers.Int32.parseLiteral(parseValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.Int32.parseLiteral(parseValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Byte", function() {
    it("should serialize and parse Byte", function() {
      expect(resolvers.Byte.serialize(20)).to.equal(20);
      expect(resolvers.Byte.parseValue(0)).to.equal(0);
      expect(resolvers.Byte.parseLiteral(parseValue('255'))).to.equal(255);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "Byte must be an integer between 0 and 255";
      expect(() => resolvers.Byte.parseValue(1000)).to.throw(emsg);
      expect(() => resolvers.Byte.parseValue("text")).to.throw(emsg);
      expect(() => resolvers.Byte.parseValue({})).to.throw(emsg);
      expect(() => resolvers.Byte.parseLiteral(parseValue('-1000'))).to.throw(emsg);
      expect(() => resolvers.Byte.parseLiteral(parseValue('10.6'))).to.throw(emsg);
      expect(() => resolvers.Byte.parseLiteral(parseValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("UInt16", function() {
    it("should serialize and parse UInt16", function() {
      expect(resolvers.UInt16.serialize(2000)).to.equal(2000);
      expect(resolvers.UInt16.parseValue(0)).to.equal(0);
      expect(resolvers.UInt16.parseLiteral(parseValue('65535'))).to.equal(65535);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "UInt16 must be an integer between 0 and 65535";
      expect(() => resolvers.UInt16.parseValue(65536)).to.throw(emsg);
      expect(() => resolvers.UInt16.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.UInt16.parseValue({})).to.throw(emsg);
      expect(() => resolvers.UInt16.parseLiteral(parseValue('-1'))).to.throw(emsg);
      expect(() => resolvers.UInt16.parseLiteral(parseValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.UInt16.parseLiteral(parseValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("UInt32", function() {
    it("should serialize and parse UInt32", function() {
      expect(resolvers.UInt32.serialize(2000000)).to.equal(2000000);
      expect(resolvers.UInt32.parseValue(0)).to.equal(0);
      expect(resolvers.UInt32.parseLiteral(parseValue('4294967295'))).to.equal(4294967295);
    });

    it("should throw if invalid value passed for parsing", function() {
      const emsg = "UInt32 must be an integer between 0 and 4294967295";
      expect(() => resolvers.UInt32.parseValue(4294967296)).to.throw(emsg);
      expect(() => resolvers.UInt32.parseValue(100.4)).to.throw(emsg);
      expect(() => resolvers.UInt32.parseValue({})).to.throw(emsg);
      expect(() => resolvers.UInt32.parseLiteral(parseValue('-1'))).to.throw(emsg);
      expect(() => resolvers.UInt32.parseLiteral(parseValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.UInt32.parseLiteral(parseValue('{a: 10}'))).to.throw(emsg);
    });
  });

});