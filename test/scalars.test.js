const { expect } = require("chai");
const parseGQLValue = require("graphql").parseValue;
const { NodeId, NodeIdType } = require("node-opcua-nodeid");
const { QualifiedName,
        LocalizedText,
        coerceQualifyName,
        coerceLocalizedText } = require("node-opcua-data-model");
const { Variant, DataType, VariantArrayType } = require("node-opcua-variant");
const { typeDefs, resolvers, parseVariant } = require("../src/scalars");


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
    it("should serialize scalar Variant", function() {
      expect(resolvers.Variant.serialize(new Variant({
        dataType: DataType.QualifiedName,
        value: coerceQualifyName("1:BrowseName")
      }))).to.equal("1:BrowseName");

      expect(resolvers.Variant.serialize(new Variant({
        dataType: DataType.LocalizedText,
        value: coerceLocalizedText("TestText")
      }))).to.equal("TestText");

      expect(resolvers.Variant.serialize(new Variant({
        dataType: DataType.Int32,
        value: 1000
      }))).to.equal(1000);
    });

    it("should serialize array Variant", function() {
      expect(resolvers.Variant.serialize(new Variant({
        arrayType: VariantArrayType.Array,
        dataType: DataType.QualifiedName,
        value: [coerceQualifyName("1:BrowseName"), coerceQualifyName("0:QualifiedName")]
      }))).to.deep.equal(["1:BrowseName", "QualifiedName"]);
    });

    it("should serialize matrix Variant", function() {
      expect(resolvers.Variant.serialize(new Variant({
        arrayType: VariantArrayType.Matrix,
        dimensions: [2, 3],
        dataType: DataType.NodeId,
        value: [
          new NodeId(NodeIdType.NUMERIC, 1, 2),
          new NodeId(NodeIdType.NUMERIC, 2, 1),
          new NodeId(NodeIdType.NUMERIC, 3, 0),
          new NodeId(NodeIdType.STRING, "Id1", 0),
          new NodeId(NodeIdType.STRING, "Id2", 1),
          new NodeId(NodeIdType.STRING, "Id3", 2),
        ]
      }))).to.deep.equal([
        ["ns=2;i=1", "ns=1;i=2", "ns=0;i=3"],
        ["ns=0;s=Id1", "ns=1;s=Id2", "ns=2;s=Id3"]
      ]);

      expect(resolvers.Variant.serialize(new Variant({
        arrayType: VariantArrayType.Matrix,
        dimensions: [2, 3, 4],
        dataType: DataType.Byte,
        value: Uint8Array.from(Array(24).keys())
      }))).to.deep.equal([
        [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11]],
        [[12, 13, 14, 15], [16, 17, 18, 19], [20, 21, 22, 23]],
      ]);
    });

    it("should parse value and literal to JSON", function() {
      expect(resolvers.Variant.parseValue({a: 10, b: "text"})).to.deep.equal({a: 10, b: "text"});
      expect(resolvers.Variant.parseLiteral(parseGQLValue('{a: 10, b: "text"}'))).to.deep.equal({a: 10, b: "text"});
    });

    it("should parse JSON to scalar Variant", function() {
      const numVariant = parseVariant(1001, DataType.UInt16, -1);
      expect(numVariant).to.be.an.instanceof(Variant);
      expect(numVariant.dataType).to.equal(DataType.UInt16);
      expect(numVariant.arrayType).to.equal(VariantArrayType.Scalar);
      expect(numVariant.dimensions).to.be.null;
      expect(numVariant.value).to.equal(1001);

      const textVariant = parseVariant("TestText!", DataType.LocalizedText, -3);
      expect(textVariant).to.be.an.instanceof(Variant);
      expect(textVariant.dataType).to.equal(DataType.LocalizedText);
      expect(textVariant.arrayType).to.equal(VariantArrayType.Scalar);
      expect(textVariant.dimensions).to.be.null;
      expect(textVariant.value.locale).to.be.null;
      expect(textVariant.value.text).to.equal("TestText!");
    });

    it("should parse JSON to array Variant", function() {
      const variant1 = parseVariant([1001, 1002, 1003], DataType.UInt16, 1);
      expect(variant1).to.be.an.instanceof(Variant);
      expect(variant1.dataType).to.equal(DataType.UInt16);
      expect(variant1.arrayType).to.equal(VariantArrayType.Array);
      expect(variant1.dimensions).to.be.null;
      expect(variant1.value).to.deep.equal(Uint16Array.from([1001, 1002, 1003]));

      const variant2 = parseVariant(["str1", "str2", "str3"], DataType.String, 0);
      expect(variant2).to.be.an.instanceof(Variant);
      expect(variant2.dataType).to.equal(DataType.String);
      expect(variant2.arrayType).to.equal(VariantArrayType.Array);
      expect(variant2.dimensions).to.be.null;
      expect(variant2.value).to.deep.equal(["str1", "str2", "str3"]);
    });

    it("should parse JSON to matrix Variant", function() {
      const variant1 = parseVariant([[10, 11, 12], [13, 14, 15]], DataType.UInt16, 2);
      expect(variant1).to.be.an.instanceof(Variant);
      expect(variant1.dataType).to.equal(DataType.UInt16);
      expect(variant1.arrayType).to.equal(VariantArrayType.Matrix);
      expect(variant1.dimensions).to.deep.equal([2, 3]);
      expect(variant1.value).to.deep.equal(Uint16Array.from([10, 11, 12, 13, 14, 15]));

      const variant2 = parseVariant([[true, false], [false, true]], DataType.Boolean, -2);
      expect(variant2).to.be.an.instanceof(Variant);
      expect(variant2.dataType).to.equal(DataType.Boolean);
      expect(variant2.arrayType).to.equal(VariantArrayType.Matrix);
      expect(variant2.dimensions).to.deep.equal([2, 2]);
      expect(variant2.value).to.deep.equal([true, false, false, true]);
    });
  });

});
