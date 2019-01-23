const { expect } = require("chai");
const { OPCUAServer } = require("node-opcua-server");
const { OPCUAClient } = require("node-opcua-client");
const { ApolloServer } = require('apollo-server');
const { createTestClient } = require('apollo-server-testing');
const { makeOPCUASchema, makeOPCUAContext } = require("../index.js");
const gql = require("graphql-tag");

const QUERY_ROOT_FOLDER = gql`
  {
    node(nodeId: "RootFolder") {
      nodeId
    }
  }
`;


describe("Methods", function() {
  let opcServer;
  let opcClient;
  let client;

  before(function() {
    opcServer = new OPCUAServer();
    opcClient = new OPCUAClient();

    // Set 10 seconds timeout for environment initialization
    this.timeout(10000);

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

});
