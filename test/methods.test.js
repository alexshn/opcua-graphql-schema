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

const METHOD_CALL = gql`
  mutation callMethod($objectId: NodeId!, $methodId: NodeId!, $inputArguments: [Variant]) {
    callMethod(methodToCall: {
      objectId: $objectId
      methodId: $methodId
      inputArguments: $inputArguments
    })
    {
      statusCode {
        name
        value
        description
      }
      inputArgumentResults {
        name
        value
        description
      }
      outputArguments
    }
  }
`;

const GOOD_STATUS_CODE = {
  name: "Good",
  value: 0,
  description: "No Error"
};


describe("Methods", function() {
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


  // No InputArguments and OutputArguments properies
  describe("Method without arguments", function() {
    let methodCounter = 0;

    before(function() {
      const addressSpace = opcServer.engine.addressSpace;
      const method = addressSpace.rootFolder.objects.objectWithMethods.methodNoArgs;

      method.bindMethod(function(inputArguments, context, callback) {
        methodCounter++;
        callback(null, {
          statusCode: opcua.StatusCodes.Good,
          outputArguments: []
        });
      });
    });

    it("should be executed successfully", function() {
      const currentCount = methodCounter;

      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5010", inputArguments: []}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.callMethod).to.be.not.null;
        expect(resp.data.callMethod.statusCode).to.deep.equal(GOOD_STATUS_CODE);

        expect(resp.data.callMethod.inputArgumentResults).to.have.lengthOf(0);
        expect(resp.data.callMethod.outputArguments).to.have.lengthOf(0);
        expect(methodCounter).to.equal(currentCount + 1);
      });
    });

    it("should fail if inputArguments provided", function() {
      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5010", inputArguments: [10, "String"]}
      }).then(resp => {
        expect(resp.errors).to.not.be.undefined;
        expect(resp.errors).to.not.be.empty;
        expect(resp.errors[0].message).to.be.a("string");
      });
    });
  });


  // Has only InputArguments properies
  describe("Method with input arguments only", function() {
    let testValue = "";

    before(function() {
      const addressSpace = opcServer.engine.addressSpace;
      const method = addressSpace.rootFolder.objects.objectWithMethods.methodInArgs;

      method.bindMethod(function(inputArguments, context, callback) {
        testValue = inputArguments[0].value.text;

        callback(null, {
          statusCode: opcua.StatusCodes.Good,
          outputArguments: []
        });
      });
    });

    it("should be executed successfully", function() {
      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5020", inputArguments: ["TestString"]}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.callMethod).to.be.not.null;
        expect(resp.data.callMethod.statusCode).to.deep.equal(GOOD_STATUS_CODE);

        expect(resp.data.callMethod.inputArgumentResults).to.have.lengthOf(1);
        expect(resp.data.callMethod.inputArgumentResults[0]).to.deep.equal(GOOD_STATUS_CODE);
        expect(resp.data.callMethod.outputArguments).to.have.lengthOf(0);
        expect(testValue).to.equal("TestString");
      });
    });

    it("should fail if inputArguments is not provided", function() {
      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5020", inputArguments: []}
      }).then(resp => {
        expect(resp.errors).to.not.be.undefined;
        expect(resp.errors).to.not.be.empty;
        expect(resp.errors[0].message).to.be.a("string");
      });
    });

    it("should fail if wrong number of inputArguments is provided", function() {
      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5020", inputArguments: ["TestString", "String2"]}
      }).then(resp => {
        expect(resp.errors).to.not.be.undefined;
        expect(resp.errors).to.not.be.empty;
        expect(resp.errors[0].message).to.be.a("string");
      });
    });

    it("should fail if wrong types of inputArguments are provided", function() {
      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5020", inputArguments: [1.333]}
      }).then(resp => {
        expect(resp.errors).to.not.be.undefined;
        expect(resp.errors).to.not.be.empty;
        expect(resp.errors[0].message).to.be.a("string");
      });
    });
  });


  // Has InputArguments and OutputArguments properies, but InputArguments is empty
  describe("Method with output arguments only", function() {
    let resultA = 0;
    let resultB = "";

    before(function() {
      const addressSpace = opcServer.engine.addressSpace;
      const method = addressSpace.rootFolder.objects.objectWithMethods.methodOutArgs;

      method.bindMethod(function(inputArguments, context, callback) {
        callback(null, {
          statusCode: opcua.StatusCodes.Good,
          outputArguments: [
            {
              dataType: opcua.DataType.UInt32,
              value: resultA
            },
            {
              dataType: opcua.DataType.LocalizedText,
              value: opcua.coerceLocalizedText(resultB)
            }
          ]
        });
      });
    });

    it("should be executed successfully", function() {
      resultA = 121;
      resultB = "Test text";

      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5030", inputArguments: []}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.callMethod).to.be.not.null;
        expect(resp.data.callMethod.statusCode).to.deep.equal(GOOD_STATUS_CODE);
        expect(resp.data.callMethod.inputArgumentResults).to.have.lengthOf(0);
        expect(resp.data.callMethod.outputArguments).to.have.lengthOf(2);
        expect(resp.data.callMethod.outputArguments[0]).to.equal(121);
        expect(resp.data.callMethod.outputArguments[1]).to.equal("Test text");
      });
    });

    it("should fail if inputArguments provided", function() {
      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5030", inputArguments: ["Test text"]}
      }).then(resp => {
        expect(resp.errors).to.not.be.undefined;
        expect(resp.errors).to.not.be.empty;
        expect(resp.errors[0].message).to.be.a("string");
      });
    });
  });


  // Has InputArguments and OutputArguments properies
  describe("Method with input and output arguments", function() {
    before(function() {
      const addressSpace = opcServer.engine.addressSpace;
      const method = addressSpace.rootFolder.objects.objectWithMethods.methodInOutArgs;

      method.bindMethod(function(inputArguments, context, callback) {
        callback(null, {
          statusCode: opcua.StatusCodes.Good,
          outputArguments: [{
            dataType: opcua.DataType.Double,
            value: inputArguments[0].value * inputArguments[1].value
          }]
        });
      });
    });

    it("should be executed successfully", function() {
      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5040", inputArguments: [1.5, 20]}
      }).then(resp => {
        expect(resp.errors, resp.errors).to.be.undefined;
        expect(resp.data.callMethod).to.be.not.null;
        expect(resp.data.callMethod.statusCode).to.deep.equal(GOOD_STATUS_CODE);

        expect(resp.data.callMethod.inputArgumentResults).to.have.lengthOf(2);
        expect(resp.data.callMethod.inputArgumentResults[0]).to.deep.equal(GOOD_STATUS_CODE);
        expect(resp.data.callMethod.inputArgumentResults[1]).to.deep.equal(GOOD_STATUS_CODE);

        expect(resp.data.callMethod.outputArguments).to.have.lengthOf(1);
        expect(resp.data.callMethod.outputArguments[0]).to.equal(30);
      });
    });

    it("should fail if wrong number of inputArguments is provided", function() {
      // TODO
    });

    it("should fail if wrong types of inputArguments are provided", function() {
      // TODO
    });
  });


  describe("Other", function() {
    it("should fail if method doesn't exist", function() {
      return client.mutate({
        mutation: METHOD_CALL,
        variables: {objectId: "ns=1;i=5000", methodId: "ns=1;i=5999", inputArguments: [1, 2]}
      }).then(resp => {
        expect(resp.errors).to.not.be.undefined;
        expect(resp.errors).to.not.be.empty;
        expect(resp.errors[0].message).to.be.a("string");
      });
    });
  });

});
