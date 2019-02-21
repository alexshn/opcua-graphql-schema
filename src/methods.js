"use strict";
const gql = require("graphql-tag");
const { resolveNodeId } = require("node-opcua-nodeid");
const { Variant, DataType } = require("node-opcua-variant");
const { parseVariant } = require("./scalars");
const { DataTypeCache } = require("./data-type-cache");

//------------------------------------------------------------------------------
// Type definition
//------------------------------------------------------------------------------

const typeDefs = gql`
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
  const methods = requests.map(request => request.methodId);

  // Request input argument types.
  // This is required to convert input JSON to node-opcua Variant.
  return DataTypeCache.getInputArgumentsInfo(context, methods).then(inputArgumentProp => {
    const callRequests = requests.map((request, i) => {
      const methodInputArgumentDefs = inputArgumentProp[i];

      if (!request.inputArguments || request.inputArguments.length === 0) {
        if (methodInputArgumentDefs.length !== 0) {
          throw new Error(`Method ${request.methodId} requires inputArguments`);
        }

        return {
          objectId: request.objectId,
          methodId: request.methodId
        };
      }

      if (methodInputArgumentDefs.length != request.inputArguments.length) {
        throw new Error(`Input arguments array of the method ${request.methodId} has a wrong length`);
      }

      // Map JSON input args to Variants
      const inputArgs = request.inputArguments.map((arg, j) => {
        const argDef = methodInputArgumentDefs[j];
        const dataType = argDef.dataType;

        // Only built-in types are supported
        if (dataType.namespace || dataType.value > 25) {
          throw new Error(`Data type ${dataType} is not supported.`);
        }

        return parseVariant(arg, DataType[dataType.value], argDef.valueRank);
      });

      return {
        objectId: request.objectId,
        methodId: request.methodId,
        inputArguments: inputArgs
      };
    });

    return session.call(callRequests);
  });
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
