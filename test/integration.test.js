const { expect } = require("chai");
const gql = require("graphql-tag");
const { ApolloServer } = require('apollo-server');
const { createTestClient } = require('apollo-server-testing');
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
    NodeClass: {dataType: DataType.Int32, value: NodeClass.Object},
    BrowseName: {dataType: DataType.QualifiedName, value: coerceQualifyName("1:BrowseName")},
    DisplayName: {dataType: DataType.LocalizedText, value: coerceLocalizedText("TestText")},
    EventNotifier: {dataType: DataType.Byte, value: 0},
  },
  "ns=2;s=Variable": {
    NodeClass: {dataType: DataType.Int32, value: NodeClass.Variable},
    BrowseName: {dataType: DataType.QualifiedName, value: coerceQualifyName("2:Variable")},
    DisplayName: {dataType: DataType.LocalizedText, value: coerceLocalizedText("TestText2")},
    Value: {dataType: DataType.Int32, value: 5050},
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
  }
};

const QUERY_NODE = gql`
  query queryNode($nodeId: NodeId!) {
    node(nodeId: $nodeId)
    {
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
    nodes(nodeIds: $nodeIds)
    {
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
          displayName: "TestText2",
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

});
