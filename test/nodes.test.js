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
        "Object",
        "ObjectType",
        "ReferenceType",
        "Variable",
        "VariableType",
        "DataType",
        "Method",
        "View"
      ]);
    });
  });


  describe("Query", function() {
    it("should have query resolvers", function() {
      expect(resolvers.Query.node).to.be.a('function');
      expect(resolvers.Query.nodes).to.be.a('function');
    });
  });

  const parent = {
    nodeClass: new DataValue({
      value: new Variant({
        dataType: DataType.Int32,
        value: NodeClass.Object
      }),
      statusCode: StatusCodes.Good
    }),
    browseName: new DataValue({
      value: new Variant({
        dataType: DataType.QualifiedName,
        value: coerceQualifyName("1:BrowseName")
      }),
      statusCode: StatusCodes.Good
    }),
    displayName: new DataValue({
      value: new Variant({
        dataType: DataType.LocalizedText,
        value: coerceLocalizedText("TestText")
      }),
      statusCode: StatusCodes.Good
    }),
    description: new DataValue({
      value: new Variant({
        dataType: DataType.LocalizedText,
        value: coerceLocalizedText("TestText")
      }),
      statusCode: StatusCodes.Good
    }),
    writeMask: new DataValue({
      value: new Variant({
        dataType: DataType.UInt32,
        value: 257
      }),
      statusCode: StatusCodes.Good
    }),
    userWriteMask: new DataValue({
      value: new Variant({
        dataType: DataType.UInt32,
        value: 258
      }),
      statusCode: StatusCodes.Good
    }),
    eventNotifier: new DataValue({
      value: new Variant({
        dataType: DataType.Byte,
        value: 12
      }),
      statusCode: StatusCodes.Good
    }),
    isAbstract: new DataValue({
      value: new Variant({
        dataType: DataType.Boolean,
        value: true
      }),
      statusCode: StatusCodes.Good
    }),
    symmetric: new DataValue({
      value: new Variant({
        dataType: DataType.Boolean,
        value: false
      }),
      statusCode: StatusCodes.Good
    }),
    inverseName: new DataValue({
      value: new Variant({
        dataType: DataType.LocalizedText,
        value: coerceLocalizedText("TestName")
      }),
      statusCode: StatusCodes.Good
    }),
    dataType: new DataValue({
      value: new Variant({
        dataType: DataType.NodeId,
        value: resolveNodeId("ns=1;i=1000")
      }),
      statusCode: StatusCodes.Good
    }),
    valueRank: new DataValue({
      value: new Variant({
        dataType: DataType.Int32,
        value: 1000
      }),
      statusCode: StatusCodes.Good
    }),
    arrayDimensions: new DataValue({
      value: new Variant({
        dataType: DataType.UInt32,
        value: [10, 20]
      }),
      statusCode: StatusCodes.Good
    }),
    accessLevel: new DataValue({
      value: new Variant({
        dataType: DataType.Byte,
        value: 1
      }),
      statusCode: StatusCodes.Good
    }),
    userAccessLevel: new DataValue({
      value: new Variant({
        dataType: DataType.Byte,
        value: 2
      }),
      statusCode: StatusCodes.Good
    }),
    minimumSamplingInterval: new DataValue({
      value: new Variant({
        dataType: DataType.Double,
        value: 10.1
      }),
      statusCode: StatusCodes.Good
    }),
    historizing: new DataValue({
      value: new Variant({
        dataType: DataType.Boolean,
        value: false
      }),
      statusCode: StatusCodes.Good
    }),
    executable: new DataValue({
      value: new Variant({
        dataType: DataType.Boolean,
        value: true
      }),
      statusCode: StatusCodes.Good
    }),
    userExecutable: new DataValue({
      value: new Variant({
        dataType: DataType.Boolean,
        value: false
      }),
      statusCode: StatusCodes.Good
    }),
    containsNoLoops: new DataValue({
      value: new Variant({
        dataType: DataType.Boolean,
        value: true
      }),
      statusCode: StatusCodes.Good
    }),
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
});
