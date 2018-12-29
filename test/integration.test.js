const { expect } = require("chai");
const gql = require("graphql-tag");
const { ApolloServer } = require('apollo-server');
const { createTestClient } = require('apollo-server-testing');
const { resolveNodeId, sameNodeId } = require("node-opcua-nodeid");
const { NodeClass,
        AttributeNameById,
        coerceQualifyName,
        coerceLocalizedText } = require("node-opcua-data-model");
const { DataValue } = require("node-opcua-data-value");
const { StatusCodes } = require("node-opcua-status-code");
const { Variant, DataType } = require("node-opcua-variant");
const { makeOPCUASchema, makeOPCUAContext } = require("../index.js");

const dataMock = {
  "ns=1;i=100": {
    NodeClass: {dataType: DataType.Int32, value: NodeClass.Object.value},
    BrowseName: {dataType: DataType.QualifiedName, value: coerceQualifyName("1:BrowseName")},
    DisplayName: {dataType: DataType.LocalizedText, value: coerceLocalizedText("TestText")},
    EventNotifier: {dataType: DataType.Byte, value: 0},

    references: [
      {
        referenceTypeId: resolveNodeId("HasProperty"),
        isForward: true,
        nodeId: resolveNodeId("ns=2;s=Variable"),
        typeDefinition: resolveNodeId("ns=2;s=Type"),
      },
      {
        referenceTypeId: resolveNodeId("HasTypeDefinition"),
        isForward: true,
        nodeId: resolveNodeId("ns=2;s=ObjectType"),
        typeDefinition: resolveNodeId("ns=2;s=TypeOfType"),
      },
    ],
  },
  "ns=2;s=Variable": {
    NodeClass: {dataType: DataType.Int32, value: NodeClass.Variable.value},
    BrowseName: {dataType: DataType.QualifiedName, value: coerceQualifyName("2:Variable")},
    DisplayName: {dataType: DataType.LocalizedText, value: coerceLocalizedText("Variable")},
    Value: {dataType: DataType.Int32, value: 5050},

    references: [],
  },
  "ns=2;s=ObjectType": {
    NodeClass: {dataType: DataType.Int32, value: NodeClass.ObjectType.value},
    BrowseName: {dataType: DataType.QualifiedName, value: coerceQualifyName("2:ObjectType")},
    DisplayName: {dataType: DataType.LocalizedText, value: coerceLocalizedText("ObjectType")},
    IsAbstract: {dataType: DataType.Boolean, value: false},

    references: [],
  },
};

const sessionMock = {
  read(nodesToRead) {
    const result = nodesToRead.map(item => {
      const nodeId = item.nodeId.toString();
      const attr = AttributeNameById[item.attributeId];

      if (dataMock[nodeId] && dataMock[nodeId][attr]) {
        return new DataValue({
          value: new Variant(dataMock[nodeId][attr]),
          statusCode: StatusCodes.Good
        });
      } else {
        return new DataValue({
          statusCode: StatusCodes.Bad
        })
      }
    });

    return Promise.resolve(result);
  },
  browse(nodesToBrowse) {
    const nodesToBrowseArr = Array.isArray(nodesToBrowse) ? nodesToBrowse : [nodesToBrowse];

    const result = nodesToBrowseArr.map(item => {
      const nodeId = item.nodeId.toString();

      if (dataMock[nodeId] && dataMock[nodeId].references) {
        return {
          statusCode: StatusCodes.Good,
          references: dataMock[nodeId].references.map(ref => {
            const targetNodeId = ref.nodeId.toString();
            return Object.assign({}, ref, {
              nodeClass: NodeClass.get(dataMock[targetNodeId].NodeClass.value),
              browseName: dataMock[targetNodeId].BrowseName.value,
              displayName: dataMock[targetNodeId].DisplayName.value,
            });
          })
          // Mock supports filtering by refId and nodeClass only
          .filter(ref => item.referenceTypeId == null || sameNodeId(item.referenceTypeId, ref.referenceTypeId))
          .filter(ref => item.nodeClassMask == 0 || item.nodeClassMask & ref.nodeClass.value)
        };
      } else {
        return { statusCode: StatusCodes.Bad, references: [] };
      }
    });

    return Promise.resolve(Array.isArray(nodesToBrowse) ? result : result[0]);
  }
};

const QUERY_NODE = gql`
  query queryNode($nodeId: NodeId!) {
    node(nodeId: $nodeId) {
      nodeId
      nodeClass
      browseName
      displayName
      ...on Object {
        eventNotifier
      }
    }
  }
`;


const QUERY_NODES = gql`
  query queryNodes($nodeIds: [NodeId]!) {
    nodes(nodeIds: $nodeIds) {
      nodeId
      nodeClass
      browseName
      displayName
      ...on Object {
        eventNotifier
      }
      ...on Variable {
        value
      }
    }
  }
`;

const QUERY_REFERENCES = gql`
  query queryRefs($nodeId: NodeId!, $filter: BrowseDescription) {
    node(nodeId: $nodeId) {
      nodeId
      references(filter: $filter) {
        referenceTypeId
        isForward
        nodeId
        nodeClass
        browseName
        displayName
        typeDefinition
      }
    }
  }
`;

const QUERY_TARGET_NODE = gql`
  query queryTargets($nodeId: NodeId!, $filter: BrowseDescription) {
    node(nodeId: $nodeId) {
      nodeId
      references(filter: $filter) {
        referenceTypeId
        targetNode {
          nodeId
          nodeClass
          browseName
          displayName
          ...on Variable {
            value
          }
        }
      }
    }
  }
`;

describe("Integration", function() {

  describe("Queries", function() {
    let client;

    before(function() {
      client = createTestClient(new ApolloServer({
        schema: makeOPCUASchema(),
        context: makeOPCUAContext({session: sessionMock})
      }));
    });

    it("should query node attributes", function() {
      return client.query({query: QUERY_NODE, variables: {nodeId: "ns=1;i=100"}})
      .then(res => {
        expect(res.errors).to.be.undefined;
        expect(res.data.node).to.not.be.undefined;

        const obj = res.data.node;
        expect(obj.nodeId).to.equal("ns=1;i=100");
        expect(obj.nodeClass).to.equal("Object");
        expect(obj.browseName).to.equal("1:BrowseName");
        expect(obj.displayName).to.equal("TestText");
        expect(obj.eventNotifier).to.equal(0);
      });
    });

    it("should query multiple nodes", function() {
      return client.query({query: QUERY_NODES, variables: {nodeIds: ["ns=1;i=100", "ns=2;s=Variable"]}})
      .then(res => {
        expect(res.errors).to.be.undefined;
        expect(res.data.nodes).to.not.be.undefined;
        expect(res.data.nodes).to.have.deep.members([{
          nodeId: "ns=1;i=100",
          nodeClass: "Object",
          browseName: "1:BrowseName",
          displayName: "TestText",
          eventNotifier: 0
        }, {
          nodeId: "ns=2;s=Variable",
          nodeClass: "Variable",
          browseName: "2:Variable",
          displayName: "Variable",
          value: 5050
        }])
      });
    });

    it("should return null if not existing nodeId is provided", function() {
      return client.query({query: QUERY_NODE, variables: {nodeId: "ns=1;i=1000"}})
      .then(res => {
        expect(res.errors).to.be.undefined;
        expect(res.data.node).to.be.null;
      });
    });

    it("should return empty array if not existing nodeIds are provided", function() {
      return client.query({query: QUERY_NODES, variables: {nodeIds: ["ns=1;i=1000", "ns=2;s=RootFolder"]}})
      .then(res => {
        expect(res.errors).to.be.undefined;
        expect(res.data.nodes).to.be.empty;
      });
    });

    it("should fail if nodeId has not valid format", function() {
      return client.query({query: QUERY_NODE, variables: {nodeId: "1000"}})
      .then(res => {
        expect(res.errors).to.not.be.undefined;
        expect(res.errors).to.not.be.empty;
      });
    });

    it("should fail if one of nodeIds has not valid format", function() {
      return client.query({query: QUERY_NODES, variables: {nodeIds: ["ns=1;i=1000", "SomeFolder"]}})
      .then(res => {
        expect(res.errors).to.not.be.undefined;
        expect(res.errors).to.not.be.empty;
      });
    });

    it("should fail if not valid context is provided", function() {
      const { query } = createTestClient(new ApolloServer({
        schema: makeOPCUASchema()
      }));

      return query({query: QUERY_NODE, variables: {nodeId: "ns=1;i=100"}})
      .then(res => {
        expect(res.errors).to.not.be.undefined;
        expect(res.errors).to.not.be.empty;
      });
    });
  });


  describe("References", function() {
    let client;

    before(function() {
      client = createTestClient(new ApolloServer({
        schema: makeOPCUASchema(),
        context: makeOPCUAContext({session: sessionMock})
      }));
    });

    it("should query node references with empty filter", function() {
      return client.query({query: QUERY_REFERENCES, variables: {nodeId: "ns=1;i=100"}})
      .then(res => {
        expect(res.errors).to.be.undefined;
        expect(res.data.node).to.not.be.undefined;
        expect(res.data.node.nodeId).to.equal("ns=1;i=100");

        expect(res.data.node.references).to.have.deep.members([{
          referenceTypeId: resolveNodeId("HasProperty").toString(),
          isForward: true,
          nodeId: "ns=2;s=Variable",
          nodeClass: "Variable",
          browseName: "2:Variable",
          displayName: "Variable",
          typeDefinition: "ns=2;s=Type"
        }, {
          referenceTypeId: resolveNodeId("HasTypeDefinition").toString(),
          isForward: true,
          nodeId: "ns=2;s=ObjectType",
          nodeClass: "ObjectType",
          browseName: "2:ObjectType",
          displayName: "ObjectType",
          typeDefinition: "ns=2;s=TypeOfType"
        }]);
      });
    });

    it("should query node references with refId filter", function() {
      return client.query({query: QUERY_REFERENCES, variables:
        {nodeId: "ns=1;i=100", filter: {referenceTypeId: "HasProperty"}}
      }).then(res => {
        expect(res.errors).to.be.undefined;
        expect(res.data.node).to.not.be.undefined;
        expect(res.data.node.nodeId).to.equal("ns=1;i=100");

        const references = res.data.node.references;
        expect(references).to.have.lengthOf(1);
        expect(references[0].referenceTypeId).to.equal(resolveNodeId("HasProperty").toString());
        expect(references[0].nodeId).to.equal("ns=2;s=Variable");
      });
    });

    it("should query node references with nodeClass filter", function() {
      return client.query({query: QUERY_REFERENCES, variables:
        {nodeId: "ns=1;i=100", filter: {targetNodeClass: ["ObjectType"]}}
      }).then(res => {
        expect(res.errors).to.be.undefined;
        expect(res.data.node).to.not.be.undefined;
        expect(res.data.node.nodeId).to.equal("ns=1;i=100");

        const references = res.data.node.references;
        expect(references).to.have.lengthOf(1);
        expect(references[0].referenceTypeId).to.equal(resolveNodeId("HasTypeDefinition").toString());
        expect(references[0].nodeId).to.equal("ns=2;s=ObjectType");
      });
    });

    it("should query target node attributes", function() {
      return client.query({query: QUERY_TARGET_NODE, variables:
        {nodeId: "ns=1;i=100", filter: {referenceTypeId: "HasProperty"}}
      }).then(res => {
        expect(res.errors).to.be.undefined;
        expect(res.data.node).to.not.be.undefined;
        expect(res.data.node.nodeId).to.equal("ns=1;i=100");
        expect(res.data.node.references).to.have.lengthOf(1);

        const target = res.data.node.references[0].targetNode;
        expect(target.nodeId).to.equal("ns=2;s=Variable");
        expect(target.nodeClass).to.equal("Variable");
        expect(target.browseName).to.equal("2:Variable");
        expect(target.displayName).to.equal("Variable");
        expect(target.value).to.equal(5050);
      });
    });
  });

});
