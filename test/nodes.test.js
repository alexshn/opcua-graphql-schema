const { expect } = require("chai");
const { NodeClass, coerceQualifyName, coerceLocalizedText } = require("node-opcua-data-model");
const { DataValue } = require("node-opcua-data-value");
const { StatusCodes } = require("node-opcua-status-code");
const { Variant, DataType } = require("node-opcua-variant");
const { typeDefs, resolvers } = require("../src/nodes.js");


describe("Nodes", function() {

  describe("TypeDefs", function() {
    it("should have only expected definitions", function() {
      typeDefs.definitions.map(def => {
        expect(def.kind).to.be.oneOf([
          "ObjectTypeDefinition",
          "InterfaceTypeDefinition"
        ]);
      });
    });

    it("should define only known Interface types", function() {
      const interfaces = typeDefs.definitions.reduce((result, def) => {
        def.kind === "InterfaceTypeDefinition" && result.push(def.name.value);
        return result;
      }, []);

      expect(interfaces).to.have.members([
        "Base"
      ]);
    });

    it("should define only known Object types", function() {
      const objects = typeDefs.definitions.reduce((result, def) => {
        def.kind === "ObjectTypeDefinition" && result.push(def.name.value);
        return result;
      }, []);

      expect(objects).to.have.members([
        "Query",
        "Object"
      ]);
    });
  });


  describe("Query", function() {
    it("should have query resolvers", function() {
      expect(resolvers.Query.node).to.be.a('function');
      expect(resolvers.Query.nodes).to.be.a('function');
    });
  });

  describe("Attributes", function() {
    it("should resolve nodeClass", function() {
      const dataValue = new DataValue({
        value: new Variant({
          dataType: DataType.Int32,
          value: NodeClass.Object
        }),
        statusCode: StatusCodes.Good
      });
      const ast = {fieldName: "nodeClass"};
      const parent = {nodeClass: dataValue};

      expect(resolvers.Base.__resolveType(parent)).to.equal(NodeClass.Object.key);
      expect(resolvers.Object.nodeClass(parent, null, null, ast)).to.equal(NodeClass.Object.value);
    });

    it("should resolve browseName", function() {
      const dataValue = new DataValue({
        value: new Variant({
          dataType: DataType.QualifiedName,
          value: coerceQualifyName("1:BrowseName")
        }),
        statusCode: StatusCodes.Good
      });
      const ast = {fieldName: "browseName"};
      const parent = {browseName: dataValue};

      expect(resolvers.Object.browseName(parent, null, null, ast)).to.equal(dataValue.value.value);
    });

    it("should resolve displayName", function() {
      const dataValue = new DataValue({
        value: new Variant({
          dataType: DataType.LocalizedText,
          value: coerceLocalizedText("TestText")
        }),
        statusCode: StatusCodes.Good
      });
      const ast = {fieldName: "displayName"};
      const parent = {displayName: dataValue};

      expect(resolvers.Object.displayName(parent, null, null, ast)).to.equal(dataValue.value.value);
    });

    it("should resolve description", function() {
      const dataValue = new DataValue({
        value: new Variant({
          dataType: DataType.LocalizedText,
          value: coerceLocalizedText("TestText")
        }),
        statusCode: StatusCodes.Good
      });
      const ast = {fieldName: "description"};
      const parent = {description: dataValue};

      expect(resolvers.Object.description(parent, null, null, ast)).to.equal(dataValue.value.value);
    });

    it("should resolve writeMask", function() {
      const dataValue = new DataValue({
        value: new Variant({
          dataType: DataType.UInt32,
          value: 257
        }),
        statusCode: StatusCodes.Good
      });
      const ast = {fieldName: "writeMask"};
      const parent = {writeMask: dataValue};

      expect(resolvers.Object.writeMask(parent, null, null, ast)).to.equal(dataValue.value.value);
    });

    it("should resolve userWriteMask", function() {
      const dataValue = new DataValue({
        value: new Variant({
          dataType: DataType.UInt32,
          value: 257
        }),
        statusCode: StatusCodes.Good
      });
      const ast = {fieldName: "userWriteMask"};
      const parent = {userWriteMask: dataValue};

      expect(resolvers.Object.userWriteMask(parent, null, null, ast)).to.equal(dataValue.value.value);
    });
  });

});
