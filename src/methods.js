"use strict";
const gql = require("graphql-tag");
const { resolveNodeId } = require("node-opcua-nodeid");
const { NodeClassMask,
        BrowseDirection,
        ResultMask,
        AttributeIds } = require("node-opcua-data-model");
const { Variant, DataType } = require("node-opcua-variant");
const { StatusCodes } = require("node-opcua-status-code");

//------------------------------------------------------------------------------
// Type definition
//------------------------------------------------------------------------------

const typeDefs = gql`
  type StatusCode {
    name: String
    value: UInt32
    description: String
  }

  input CallMethodRequest {
    objectId: NodeId!
    methodId: NodeId!
    inputArguments: [Variant]
  }

  type CallMethodResult {
    statusCode: StatusCode
    inputArgumentResults: [StatusCode]
    outputArguments: [Variant]
  }

  type Mutation {
    callMethod(methodToCall: CallMethodRequest!): CallMethodResult
    callMethods(methodsToCall: [CallMethodRequest]!): [CallMethodResult]
  }
`;

module.exports.typeDefs = typeDefs;

//------------------------------------------------------------------------------
// Resolvers
//------------------------------------------------------------------------------

function callMethodsInteranl(requests, context) {
  const { session } = context.opcua;

  // Request input argument types.
  // This is required to convert input JSON to node-opcua Variant.
  const methodsToBrowse = requests.map(request => ({
    nodeId: request.methodId,
    referenceTypeId: "HasProperty",
    includeSubtypes: true,
    browseDirection: BrowseDirection.Forward,
    nodeClassMask: NodeClassMask.Variable,
    resultMask: ResultMask.BrowseName
  }));

  return session.browse(methodsToBrowse).then(browseResult => {
    const nodesToRead = requests.map((request, i) => {
      const args = browseResult[i].references.find(ref =>
        ref.browseName &&
        ref.browseName.namespaceIndex === 0 &&
        ref.browseName.name === "InputArguments"
      );

      if (!args) {
        throw new Error(`Failed to get InputArguments property of the method ${request.methodId}`);
      }

      return {
        nodeId: args.nodeId,
        attributeId: AttributeIds.Value
      };
    });

    return session.read(nodesToRead);
  })
  .then(dataValues => {
    const callRequests = requests.map((request, i) => {
      const inputTypes = dataValues[i].value.value;

      if (inputTypes.length != request.inputArguments.length) {
        throw new Error(`Input arguments array of the method ${request.methodId} has a wrong length`);
      }

      // Map JSON input args to Variants
      const inputArgs = request.inputArguments.map((arg, i) => {
        const dataType = inputTypes[i].dataType;

        // Only built-in types are supported
        if (dataType.namespace || dataType.value > 25) {
          throw new Error(`Data type ${dataType} is not supported.`);
        }

        return new Variant({ dataType: DataType[dataType.value], value: arg });
      });

      return {
        objectId: request.objectId,
        methodId: request.methodId,
        inputArguments: inputArgs
      };
    });

    return session.call(callRequests);
  })
}

function callMethod(parent, args, context, ast) {
  return callMethodsInteranl([args.methodToCall], context).then(results => results[0]);
}

function callMethods(parent, args, context, ast) {
  return callMethodsInteranl(args.methodsToCall, context);
}

const resolvers = {
  Mutation: {
    callMethod: callMethod,
    callMethods: callMethods,
  },
};

module.exports.resolvers = resolvers;
