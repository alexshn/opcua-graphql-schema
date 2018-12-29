const { expect } = require("chai");
const { resolveNodeId } = require("node-opcua-nodeid");
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
          "InterfaceTypeDefinition",
          "InputObjectTypeDefinition"
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
        "Object",
        "ObjectType",
        "ReferenceType",
        "Variable",
        "VariableType",
        "DataType",
        "Method",
        "View",
        "ReferenceDescription"
      ]);
    });
  });


  describe("Query", function() {
    it("should have query resolvers", function() {
      expect(resolvers.Query.node).to.be.a('function');
      expect(resolvers.Query.nodes).to.be.a('function');
    });
  });

  function makeDataValue(dataType, value) {
    return new DataValue({
      value: new Variant({dataType, value}),
      statusCode: StatusCodes.Good
    });
  }

  const parent = {
    nodeClass:                makeDataValue(DataType.Int32,         NodeClass.Object.value),
    browseName:               makeDataValue(DataType.QualifiedName, coerceQualifyName("1:BrowseName")),
    displayName:              makeDataValue(DataType.LocalizedText, coerceLocalizedText("TestText")),
    description:              makeDataValue(DataType.LocalizedText, coerceLocalizedText("TestText")),
    writeMask:                makeDataValue(DataType.UInt32,        257),
    userWriteMask:            makeDataValue(DataType.UInt32,        258),
    eventNotifier:            makeDataValue(DataType.Byte,          12),
    isAbstract:               makeDataValue(DataType.Boolean,       true),
    symmetric:                makeDataValue(DataType.Boolean,       false),
    inverseName:              makeDataValue(DataType.LocalizedText, coerceLocalizedText("TestName")),
    value:                    makeDataValue(DataType.Int32,         5050),
    dataType:                 makeDataValue(DataType.NodeId,        resolveNodeId("ns=1;i=1000")),
    valueRank:                makeDataValue(DataType.Int32,         1000),
    arrayDimensions:          makeDataValue(DataType.UInt32,        [10, 20]),
    accessLevel:              makeDataValue(DataType.Byte,          1),
    userAccessLevel:          makeDataValue(DataType.Byte,          2),
    minimumSamplingInterval:  makeDataValue(DataType.Double,        10.1),
    historizing:              makeDataValue(DataType.Boolean,       false),
    executable:               makeDataValue(DataType.Boolean,       true),
    userExecutable:           makeDataValue(DataType.Boolean,       false),
    containsNoLoops:          makeDataValue(DataType.Boolean,       true),
  };

  function checkAttribute(node, attr) {
    expect(node[attr](parent, null, null, {fieldName: attr})).to.equal(parent[attr].value.value);
  }

  function checkBaseAttributes(node) {
    checkAttribute(node, "nodeClass");
    checkAttribute(node, "browseName");
    checkAttribute(node, "displayName");
    checkAttribute(node, "description");
    checkAttribute(node, "writeMask");
    checkAttribute(node, "userWriteMask");
  }

  describe("Base", function() {
    it("should resolve node type", function() {
      expect(resolvers.Base.__resolveType(parent)).to.equal(NodeClass.Object.key);
    });
  });

  describe("Object", function() {
    it("should resolve Base attributes", function() {
      checkBaseAttributes(resolvers.Object);
    });

    it("should resolve Object attributes", function() {
      checkAttribute(resolvers.Object, "eventNotifier");
    });
  });

  describe("ObjectType", function() {
    it("should resolve Base attributes", function() {
      checkBaseAttributes(resolvers.ObjectType);
    });

    it("should resolve ObjectType attributes", function() {
      checkAttribute(resolvers.ObjectType, "isAbstract");
    });
  });

  describe("ReferenceType", function() {
    it("should resolve Base attributes", function() {
      checkBaseAttributes(resolvers.ReferenceType);
    });

    it("should resolve ReferenceType attributes", function() {
      checkAttribute(resolvers.ReferenceType, "isAbstract");
      checkAttribute(resolvers.ReferenceType, "symmetric");
      checkAttribute(resolvers.ReferenceType, "inverseName");
    });
  });

  describe("Variable", function() {
    it("should resolve Base attributes", function() {
      checkBaseAttributes(resolvers.Variable);
    });

    it("should resolve Variable attributes", function() {
      const value = resolvers.VariableType.value(parent, null, null, {fieldName: "value"});
      expect(value).to.be.an.instanceof(Variant);
      expect(value.dataType).to.equal(DataType.Int32);
      expect(value.value).to.equal(5050);
      checkAttribute(resolvers.Variable, "dataType");
      checkAttribute(resolvers.Variable, "valueRank");
      checkAttribute(resolvers.Variable, "arrayDimensions");
      checkAttribute(resolvers.Variable, "accessLevel");
      checkAttribute(resolvers.Variable, "userAccessLevel");
      checkAttribute(resolvers.Variable, "minimumSamplingInterval");
      checkAttribute(resolvers.Variable, "historizing");
    });
  });

  describe("VariableType", function() {
    it("should resolve Base attributes", function() {
      checkBaseAttributes(resolvers.VariableType);
    });

    it("should resolve VariableType attributes", function() {
      const value = resolvers.VariableType.value(parent, null, null, {fieldName: "value"});
      expect(value).to.be.an.instanceof(Variant);
      expect(value.dataType).to.equal(DataType.Int32);
      expect(value.value).to.equal(5050);
      checkAttribute(resolvers.VariableType, "dataType");
      checkAttribute(resolvers.VariableType, "valueRank");
      checkAttribute(resolvers.VariableType, "arrayDimensions");
      checkAttribute(resolvers.VariableType, "isAbstract");
    });
  });

  describe("DataType", function() {
    it("should resolve Base attributes", function() {
      checkBaseAttributes(resolvers.DataType);
    });

    it("should resolve DataType attributes", function() {
      checkAttribute(resolvers.DataType, "isAbstract");
    });
  });

  describe("Method", function() {
    it("should resolve Base attributes", function() {
      checkBaseAttributes(resolvers.Method);
    });

    it("should resolve Method attributes", function() {
      checkAttribute(resolvers.Method, "executable");
      checkAttribute(resolvers.Method, "userExecutable");
    });
  });

  describe("View", function() {
    it("should resolve Base attributes", function() {
      checkBaseAttributes(resolvers.View);
    });

    it("should resolve View attributes", function() {
      checkAttribute(resolvers.View, "containsNoLoops");
      checkAttribute(resolvers.View, "eventNotifier");
    });
  });

  describe("ReferenceDescription", function() {
    it("should have targetNode resolver", function() {
      expect(resolvers.ReferenceDescription.targetNode).to.be.a('function');
    });
  });
});
