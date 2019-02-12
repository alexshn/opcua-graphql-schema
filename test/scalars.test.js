const { expect } = require("chai");
const parseGQLValue = require("graphql").parseValue;
const { QualifiedName,
        LocalizedText,
        coerceQualifyName,
        coerceLocalizedText } = require("node-opcua-data-model");
const { NodeId, NodeIdType } = require("node-opcua-nodeid");
const { ExpandedNodeId } = require("node-opcua-nodeid/src/expanded_nodeid");
const { StatusCodes } = require("node-opcua-status-code");
const { Variant, DataType, VariantArrayType } = require("node-opcua-variant");
const { typeDefs, resolvers, parseVariant } = require("../src/scalars");


describe("Scalars", function() {

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

  describe("Int64/UInt64", function() {
    [resolvers.Int64, resolvers.UInt64].forEach(type => {
      it(`should serialize and parse ${type.name}`, function() {
        expect(type.serialize([0x01234567, 0x89ABCDEF])).to.deep.equal([0x01234567, 0x89ABCDEF]);
        expect(type.parseValue([0, 0])).to.deep.equal([0, 0]);
        expect(type.parseLiteral(parseGQLValue('[0, 98765]'))).to.deep.equal([0, 98765]);
      });

      it(`should throw if invalid value passed for parsing to ${type.name}`, function() {
        const emsg1 = "Int64 and UInt64 must be an array of high and low 32-bit components.";
        const emsg2 = "Int64 and UInt64 components must be 32-bit unsinged integers.";
        expect(() => type.parseValue(4294967296)).to.throw(emsg1);
        expect(() => type.parseLiteral(parseGQLValue('"text"'))).to.throw(emsg1);
        expect(() => type.parseLiteral(parseGQLValue('[0, -1]'))).to.throw(emsg2);
      });
    });
  });

  describe("Double", function() {
    it("should serialize and parse Double", function() {
      expect(resolvers.Double.serialize(200.01)).to.equal(200.01);
      expect(resolvers.Double.parseValue(0)).to.equal(0);
      expect(resolvers.Double.parseLiteral(parseGQLValue('0.1234'))).to.equal(0.1234);
    });

    it("should throw if invalid value passed for parsing Double", function() {
      const emsg = "Double must be a number";
      expect(() => resolvers.Double.parseLiteral(parseGQLValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.Double.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("DateTime", function() {
    it("should serialize and parse DateTime", function() {
      expect(resolvers.DateTime.serialize(new Date("2019-02-10T23:38:17.859Z"))).to.equal("2019-02-10T23:38:17.859Z");
      expect(resolvers.DateTime.parseValue("1970-01-01T00:00:00.001Z")).to.deep.equal(new Date("1970-01-01T00:00:00.001Z"));
      expect(resolvers.DateTime.parseLiteral(parseGQLValue('"2013-03-01T01:10:00Z"'))).to.deep.equal(new Date("2013-03-01T01:10:00.000Z"));
    });

    it("should throw if invalid value passed for parsing DateTime", function() {
      const emsg = "DateTime must be encoded as a string in simplified extended ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)";
      expect(() => resolvers.DateTime.parseValue(0)).to.throw(emsg);
      expect(() => resolvers.DateTime.parseLiteral(parseGQLValue('"text"'))).to.throw(emsg);
      expect(() => resolvers.DateTime.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("Guid", function() {
    it("should serialize and parse Guid", function() {
      expect(resolvers.Guid.serialize("72962B91-FA75-4AE6-8D28-B404DC7DAF63")).to.equal("72962B91-FA75-4AE6-8D28-B404DC7DAF63");
      expect(resolvers.Guid.parseValue("72962B91-FA75-4AE6-8D28-B404DC7DAF63")).to.equal("72962B91-FA75-4AE6-8D28-B404DC7DAF63");
      expect(resolvers.Guid.parseLiteral(parseGQLValue('"00000000-0000-0000-0000-000000000000"'))).to.equal("00000000-0000-0000-0000-000000000000");
    });

    it("should throw if invalid value passed for parsing Guid", function() {
      const emsg = "Guid must be encoded as a string in format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
      expect(() => resolvers.Guid.parseValue(0)).to.throw(emsg);
      expect(() => resolvers.Guid.parseLiteral(parseGQLValue('"00000000-0000-0000"'))).to.throw(emsg);
      expect(() => resolvers.Guid.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("ByteString", function() {
    it("should serialize and parse ByteString", function() {
      expect(resolvers.ByteString.serialize(Buffer.from("Test text"))).to.equal("VGVzdCB0ZXh0");
      expect(resolvers.ByteString.parseValue("UGFyc2UgdGVzdA==")).to.deep.equal(Buffer.from("Parse test"));
      expect(resolvers.ByteString.parseLiteral(parseGQLValue('"TGl0ZXJhbCB0ZXN0"'))).to.deep.equal(Buffer.from("Literal test"));
    });

    it("should throw if invalid value passed for parsing Guid", function() {
      const emsg = "ByteString must be encoded as a base64 string";
      expect(() => resolvers.ByteString.parseValue(0)).to.throw(emsg);
      expect(() => resolvers.ByteString.parseLiteral(parseGQLValue('{a: 10}'))).to.throw(emsg);
    });
  });

  describe("XmlElement", function() {
    it("should serialize and parse XmlElement", function() {
      expect(resolvers.XmlElement.serialize("<a>text</a>")).to.equal("<a>text</a>");
      expect(resolvers.XmlElement.parseValue("<a><b><b/></a>")).to.equal("<a><b><b/></a>");
      expect(resolvers.XmlElement.parseLiteral(parseGQLValue('"just text"'))).to.equal("just text");
    });
  });

  describe("NodeId", function() {
    // Serialize
    it("should serialize NodeId to a string", function() {
      const value = resolvers.NodeId.serialize(new NodeId(NodeIdType.NUMERIC, 1234, 0));
      expect(value).to.be.a('string');
      expect(value).to.equal("ns=0;i=1234");
    });

    // Parse value
    it("should parse value with NodeId as a string", function() {
      const value = resolvers.NodeId.parseValue("ns=1;i=123");
      expect(value).to.be.an.instanceof(NodeId);
      expect(value).to.deep.equal(new NodeId(NodeIdType.NUMERIC, 123, 1));
    });

    it("should parse value with NodeId as a symbolic name", function() {
      const value = resolvers.NodeId.parseValue("ObjectsFolder");
      expect(value).to.be.an.instanceof(NodeId);
      expect(value).to.deep.equal(new NodeId(NodeIdType.NUMERIC, 85, 0));
    });

    // Parse literal
    it("should parse literal with NodeId as a string", function() {
      const value = resolvers.NodeId.parseLiteral(parseGQLValue('"ns=1;s=TestNodeId"'));
      expect(value).to.be.an.instanceof(NodeId);
      expect(value).to.deep.equal(new NodeId(NodeIdType.STRING, "TestNodeId", 1));
    });

    // Parse errors
    it("should throw if invalid value is provided for parsing", function() {
      const emsg = "NodeId must be encoded as a string";
      expect(() => resolvers.NodeId.parseValue("invalid")).to.throw(/*node-opcua msg*/);
      expect(() => resolvers.NodeId.parseLiteral(parseGQLValue("10"))).to.throw(emsg);
    });;
  });

  describe("ExpandedNodeId", function() {
    it("should serialize ExpandedNodeId to a string", function() {
      const value = resolvers.ExpandedNodeId.serialize(new ExpandedNodeId(
        NodeIdType.NUMERIC, 1234, 0, "OPCUA-GraphQL-Schema-test", 1));
      expect(value).to.be.a('string');
      expect(value).to.equal("ns=0;i=1234;namespaceUri:OPCUA-GraphQL-Schema-test;serverIndex:1");
    });

    it("should serialize ExpandedNodeId to a string with NodeId format", function() {
      const value = resolvers.ExpandedNodeId.serialize(new ExpandedNodeId(NodeIdType.NUMERIC, 1234, 0, null, 0));
      expect(value).to.be.a('string');
      expect(value).to.equal("ns=0;i=1234");
    });

    it("should parse value with NodeId as a string", function() {
      const value = resolvers.ExpandedNodeId.parseValue("ns=1;i=123");
      expect(value).to.be.an.instanceof(ExpandedNodeId);
      expect(value).to.deep.equal(new ExpandedNodeId(NodeIdType.NUMERIC, 123, 1, null, 0));
    });
  });

  describe("StatusCode", function() {
    it("should serialize StatusCode to JSON", function() {
      expect(resolvers.StatusCode.serialize(StatusCodes.Good)).to.deep.equal({
        name:'Good', value: 0, description:'No Error'
      });
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
      const emsg = "QualifiedName must be encodeda as a string";
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
      const emsg = "QualifiedName must be encodeda as a string";
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
      const emsg = "LocalizedText must be encoded as a string";
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
      const emsg = "LocalizedText must be encoded as a string";
      expect(() => resolvers.LocalizedText.parseLiteral(parseGQLValue('10'))).to.throw(emsg);
      expect(() => resolvers.LocalizedText.parseLiteral(parseGQLValue('{locale: "EN"}'))).to.throw(emsg);
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
        dataType: DataType.String,
        value: "TextString"
      }))).to.equal("TextString");

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
      const numVariant = parseVariant(10.01, DataType.Float, -1);
      expect(numVariant).to.be.an.instanceof(Variant);
      expect(numVariant.dataType).to.equal(DataType.Float);
      expect(numVariant.arrayType).to.equal(VariantArrayType.Scalar);
      expect(numVariant.dimensions).to.be.null;
      expect(numVariant.value).to.equal(10.01);

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
