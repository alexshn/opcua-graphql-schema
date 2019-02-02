const { expect } = require("chai");
const { ApolloServer } = require('apollo-server');
const { createTestClient } = require('apollo-server-testing');
const { makeOPCUASchema, makeOPCUAContext } = require("../index.js");
const gql = require("graphql-tag");
const opcua = require("node-opcua");
const path = require("path");

const QUERY_ROOT_FOLDER = gql`
  {
    node(nodeId: "RootFolder") {
      nodeId
    }
  }
`;

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

const QUERY_ALL_ATTRIBUTES = gql`
  query queryNode($nodeId: NodeId!) {
    node(nodeId: $nodeId) {
      nodeId
      nodeClass
      browseName
      displayName
      description
      writeMask
      userWriteMask
      ...on Object {
        eventNotifier
      }
      ...on ObjectType {
        isAbstract
      }
      ...on ReferenceType {
        isAbstract
        symmetric
        inverseName
      }
      ...on Variable {
        value
        dataType
        valueRank
        arrayDimensions
        accessLevel
        userAccessLevel
        minimumSamplingInterval
        historizing
      }
      ...on VariableType {
        value
        dataType
        valueRank
        arrayDimensions
        isAbstract
      }
      ...on DataType {
        isAbstract
      }
      ...on Method {
        executable
        userExecutable
      }
      ...on View {
        containsNoLoops
        eventNotifier
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

const QUERY_PROPERTY = gql`
  query queryProp($nodeId: NodeId!, $propName: QualifiedName!) {
    node(nodeId: $nodeId) {
      nodeId
      property(browseName: $propName) {
        nodeId
        nodeClass
        browseName
        displayName
        value
      }
    }
  }
`;

describe("Nodes", function() {
  let opcServer;
  let opcClient;
  let client;

  before(function() {
    const test_nodeset_file = path.join(__dirname, "testnodeset.xml");

    opcClient = new opcua.OPCUAClient();
    opcServer = new opcua.OPCUAServer({
      serverInfo: { applicationUri: "urn:OPCUA-GraphQL-Schema-test" },
      nodeset_filename: [opcua.mini_nodeset_filename, test_nodeset_file]
    });

    this.timeout(10000); // 10 seconds initialization timeout

    // Initialize OPCUA server, OPCUA client and grathql test client
    return new Promise(resolve => opcServer.initialize(resolve)).then(() => {
      return new Promise(resolve => opcServer.start(resolve));
    }).then(() => {
      const endpoint = opcServer.endpoints[0].endpointDescriptions()[0];
      return opcClient.connect(endpoint.endpointUrl);
    }).then(() => {
      return opcClient.createSession();
    }).then(session => {
      client = createTestClient(new ApolloServer({
        schema: makeOPCUASchema(),
        context: makeOPCUAContext({session})
      }));
    });
  });

  after(function() {
    return opcClient.disconnect().then(() => {
      return new Promise(resolve => opcServer.shutdown(resolve));
    });
  });

  describe("Check environment", function() {
    it("OPCUA server should be running", function() {
      expect(opcServer.initialized).to.be.true;
      expect(opcServer.currentSessionCount).to.equal(1);
    });

    it("OPCUA client should be connected to the server", function() {
      expect(opcClient.knowsServerEndpoint).to.be.true;
    });

    it("GraphQL test client should be connected to the server", function() {
      return client.query({query: QUERY_ROOT_FOLDER}).then(resp => {
        expect(resp.errors).to.be.undefined;
        expect(resp.data.node.nodeId).to.equal("ns=0;i=84");
      });
    });
  });

  describe("Queries", function() {
    it("should query single node", function() {
      return client.query({query: QUERY_NODE, variables: {nodeId: "ns=1;i=2000"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;

        const obj = resp.data.node;
        expect(obj.nodeId).to.equal("ns=1;i=2000");
        expect(obj.nodeClass).to.equal("Object");
        expect(obj.browseName).to.equal("1:TestObject");
        expect(obj.displayName).to.equal("TestObject");
        expect(obj.eventNotifier).to.equal(0);
      });
    });

    it("should query multiple nodes", function() {
      return client.query({query: QUERY_NODES, variables: {nodeIds: ["ns=1;i=2000", "ns=1;i=2003"]}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.nodes).to.not.be.undefined;
        expect(resp.data.nodes).to.have.deep.members([{
          nodeId: "ns=1;i=2000",
          nodeClass: "Object",
          browseName: "1:TestObject",
          displayName: "TestObject",
          eventNotifier: 0
        }, {
          nodeId: "ns=1;i=2003",
          nodeClass: "Variable",
          browseName: "1:TestVariable",
          displayName: "TestVariable",
          value: 101.01
        }])
      });
    });

    it("should return null if not existing nodeId is provided", function() {
      return client.query({query: QUERY_NODE, variables: {nodeId: "ns=1;i=999"}})
      .then(resp => {
        expect(resp.errors).to.be.undefined;
        expect(resp.data.node).to.be.null;
      });
    });

    it("should return empty array if not existing nodeIds are provided", function() {
      return client.query({query: QUERY_NODES, variables: {nodeIds: ["ns=1;i=999", "ns=1;s=InvalidId"]}})
      .then(resp => {
        expect(resp.errors).to.be.undefined;
        expect(resp.data.nodes).to.be.empty;
      });
    });

    it("should fail if nodeId has not valid format", function() {
      return client.query({query: QUERY_NODE, variables: {nodeId: "2000"}})
      .then(resp => {
        expect(resp.errors).to.not.be.undefined;
        expect(resp.errors).to.not.be.empty;
      });
    });

    it("should fail if one of nodeIds has not valid format", function() {
      return client.query({query: QUERY_NODES, variables: {nodeIds: ["ns=1;i=2000", "SomeFolder"]}})
      .then(resp => {
        expect(resp.errors).to.not.be.undefined;
        expect(resp.errors).to.not.be.empty;
      });
    });
  });

  describe("Node classes", function() {
    before(function() {
      // Add View node since node-opcua doesn't support loading UAView from XML
      const addressSpace = opcServer.engine.addressSpace;
      const namespace = addressSpace.getOwnNamespace();

      namespace.addView({
        nodeId: "ns=1;i=2007",
        browseName: "TestView",
        displayName: "TestView",
        description: "TestView description.",
        organizedBy: "i=87",
        containsNoLoops: true,
      });
    });

    it("should query Object attributes", function() {
      return client.query({query: QUERY_ALL_ATTRIBUTES, variables: {nodeId: "ns=1;i=2000"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node).to.deep.equal({
          nodeId: "ns=1;i=2000",
          nodeClass: "Object",
          browseName: "1:TestObject",
          displayName: "TestObject",
          description: "TestObject description.",
          writeMask: 0,
          userWriteMask: 0,
          eventNotifier: 0,
        });
      });
    });

    it("should query ObjectType attributes", function() {
      return client.query({query: QUERY_ALL_ATTRIBUTES, variables: {nodeId: "ns=1;i=2001"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node).to.deep.equal({
          nodeId: "ns=1;i=2001",
          nodeClass: "ObjectType",
          browseName: "1:TestObjectType",
          displayName: "TestObjectType",
          description: "TestObjectType description.",
          writeMask: 0,
          userWriteMask: 0,
          isAbstract: false,
        });
      });
    });

    it("should query ReferenceType attributes", function() {
      return client.query({query: QUERY_ALL_ATTRIBUTES, variables: {nodeId: "ns=1;i=2002"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node).to.deep.equal({
          nodeId: "ns=1;i=2002",
          nodeClass: "ReferenceType",
          browseName: "1:TestReference",
          displayName: "TestReference",
          description: "TestReference description.",
          writeMask: 0,
          userWriteMask: 0,
          isAbstract: false,
          symmetric: false,
          inverseName: "InverseTestReference",
        });
      });
    });

    it("should query Variable attributes", function() {
      return client.query({query: QUERY_ALL_ATTRIBUTES, variables: {nodeId: "ns=1;i=2003"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node).to.deep.equal({
          nodeId: "ns=1;i=2003",
          nodeClass: "Variable",
          browseName: "1:TestVariable",
          displayName: "TestVariable",
          description: "TestVariable description.",
          writeMask: 0,
          userWriteMask: 0,
          value: 101.01,
          dataType: "ns=0;i=11",
          valueRank: -1,
          arrayDimensions: [],
          accessLevel: 1,
          userAccessLevel: 1,
          minimumSamplingInterval: 0,
          historizing: false,
        });
      });
    });

    it("should query VariableType attributes", function() {
      return client.query({query: QUERY_ALL_ATTRIBUTES, variables: {nodeId: "ns=1;i=2004"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node).to.deep.equal({
          nodeId: "ns=1;i=2004",
          nodeClass: "VariableType",
          browseName: "1:TestVariableType",
          displayName: "TestVariableType",
          description: "TestVariableType description.",
          writeMask: 0,
          userWriteMask: 0,
          value: "DefaultValue",
          dataType: "ns=0;i=12",
          valueRank: -1,
          arrayDimensions: [],
          isAbstract: false,
        });
      });
    });

    it("should query DataType attributes", function() {
      return client.query({query: QUERY_ALL_ATTRIBUTES, variables: {nodeId: "ns=1;i=2005"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node).to.deep.equal({
          nodeId: "ns=1;i=2005",
          nodeClass: "DataType",
          browseName: "1:TestDataType",
          displayName: "TestDataType",
          description: "TestDataType description.",
          writeMask: 0,
          userWriteMask: 0,
          isAbstract: true,
        });
      });
    });

    it("should query Method attributes", function() {
      return client.query({query: QUERY_ALL_ATTRIBUTES, variables: {nodeId: "ns=1;i=2006"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node).to.deep.equal({
          nodeId: "ns=1;i=2006",
          nodeClass: "Method",
          browseName: "1:TestMethod",
          displayName: "TestMethod",
          description: null,
          writeMask: 0,
          userWriteMask: 0,
          executable: false,
          userExecutable: false,
        });
      });
    });

    it("should query View attributes", function() {
      return client.query({query: QUERY_ALL_ATTRIBUTES, variables: {nodeId: "ns=1;i=2007"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node).to.deep.equal({
          nodeId: "ns=1;i=2007",
          nodeClass: "View",
          browseName: "1:TestView",
          displayName: "TestView",
          description: "TestView description.",
          writeMask: 0,
          userWriteMask: 0,
          containsNoLoops: true,
          eventNotifier: 0,
        });
      });
    });
  });

  describe("References", function() {
    it("should query node references with empty filter", function() {
      return client.query({query: QUERY_REFERENCES, variables: {nodeId: "ns=1;i=2000"}})
      .then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node.nodeId).to.equal("ns=1;i=2000");

        expect(resp.data.node.references).to.have.deep.members([{
          referenceTypeId: opcua.resolveNodeId("Organizes").toString(),
          isForward: false,
          nodeId: "ns=0;i=85",
          nodeClass: "Object",
          browseName: "Objects",
          displayName: "Objects",
          typeDefinition: "ns=0;i=61"
        }, {
          referenceTypeId: opcua.resolveNodeId("HasTypeDefinition").toString(),
          isForward: true,
          nodeId: "ns=1;i=2001",
          nodeClass: "ObjectType",
          browseName: "1:TestObjectType",
          displayName: "TestObjectType",
          typeDefinition: "ns=0;i=0"
        }, {
          referenceTypeId: opcua.resolveNodeId("HasProperty").toString(),
          isForward: true,
          nodeId: "ns=1;i=2003",
          nodeClass: "Variable",
          browseName: "1:TestVariable",
          displayName: "TestVariable",
          typeDefinition: "ns=0;i=68"
        }, ]);
      });
    });

    it("should query node references with refId filter", function() {
      return client.query({query: QUERY_REFERENCES, variables:
        {nodeId: "ns=1;i=2000", filter: {referenceTypeId: "HasProperty"}}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node.nodeId).to.equal("ns=1;i=2000");

        const references = resp.data.node.references;
        expect(references).to.have.lengthOf(1);
        expect(references[0].referenceTypeId).to.equal(opcua.resolveNodeId("HasProperty").toString());
        expect(references[0].nodeId).to.equal("ns=1;i=2003");
      });
    });

    it("should query node references with nodeClass filter", function() {
      return client.query({query: QUERY_REFERENCES, variables:
        {nodeId: "ns=1;i=2000", filter: {targetNodeClass: ["ObjectType"]}}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node.nodeId).to.equal("ns=1;i=2000");

        const references = resp.data.node.references;
        expect(references).to.have.lengthOf(1);
        expect(references[0].referenceTypeId).to.equal(opcua.resolveNodeId("HasTypeDefinition").toString());
        expect(references[0].nodeId).to.equal("ns=1;i=2001");
      });
    });

    it("should query target node attributes", function() {
      return client.query({query: QUERY_TARGET_NODE, variables:
        {nodeId: "ns=1;i=2000", filter: {referenceTypeId: "HasProperty"}}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node.nodeId).to.equal("ns=1;i=2000");
        expect(resp.data.node.references).to.have.lengthOf(1);

        const target = resp.data.node.references[0].targetNode;
        expect(target.nodeId).to.equal("ns=1;i=2003");
        expect(target.nodeClass).to.equal("Variable");
        expect(target.browseName).to.equal("1:TestVariable");
        expect(target.displayName).to.equal("TestVariable");
        expect(target.value).to.equal(101.01);
      });
    });

    it("should query property", function() {
      return client.query({query: QUERY_PROPERTY, variables:
        {nodeId: "ns=1;i=2000", propName: "1:TestVariable"}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node.nodeId).to.equal("ns=1;i=2000");

        const property = resp.data.node.property;
        expect(property.nodeId).to.equal("ns=1;i=2003");
        expect(property.nodeClass).to.equal("Variable");
        expect(property.browseName).to.equal("1:TestVariable");
        expect(property.displayName).to.equal("TestVariable");
        expect(property.value).to.equal(101.01);
      });
    });

    it("should return null for unknown property", function() {
      return client.query({query: QUERY_PROPERTY, variables:
        {nodeId: "ns=1;i=2000", propName: "WrongVariable"}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.node).to.not.be.undefined;
        expect(resp.data.node.nodeId).to.equal("ns=1;i=2000");
        expect(resp.data.node.property).to.be.null;
      });
    });
  });

});
