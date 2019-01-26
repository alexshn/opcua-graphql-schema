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

function getInputArgumentTypes(methods, context) {
  const { session } = context.opcua;

  // Browse InputAgrument property of method
  const methodsToBrowse = methods.map(method => ({
    nodeId: method,
    referenceTypeId: "HasProperty",
    includeSubtypes: true,
    browseDirection: BrowseDirection.Forward,
    nodeClassMask: NodeClassMask.Variable,
    resultMask: ResultMask.BrowseName
  }));

  return session.browse(methodsToBrowse).then(browseResults => {
    const nodeIds = methods.map((method, i) => {
      const browseResult = browseResults[i];
      const statusCode = browseResult.statusCode;

      if (!statusCode.equals(StatusCodes.Good)) {
        throw new Error(`Browse of method ${method} failed with ${statusCodes.name}: ${statusCodes.description}`);
      }

      const inputArgumentsRef = browseResult.references.find(ref =>
        ref.browseName &&
        ref.browseName.namespaceIndex === 0 &&
        ref.browseName.name === "InputArguments"
      );

      return inputArgumentsRef ? inputArgumentsRef.nodeId : null;
    });

    const nodesToRead = nodeIds.filter(nodeId => !!nodeId).map(nodeId => ({
      nodeId: nodeId,
      attributeId: AttributeIds.Value
    }));

    // If all methods don't have InputArguments
    if (nodesToRead.length === 0) {
      return nodeIds.map(ign => []);
    }

    // Read value of InputArguments properties
    return session.read(nodesToRead).then(dataValues => {
      const result = [];
      let di = 0;

      nodeIds.forEach(nodeId => {
        result.push(nodeId ? dataValues[di++].value.value : []);
      });

      return result;
    });
  });
}

function callMethodsInteranl(requests, context) {
  const { session } = context.opcua;
  const methods = requests.map(request => request.methodId);

  // Request input argument types.
  // This is required to convert input JSON to node-opcua Variant.
  return getInputArgumentTypes(methods, context).then(inputArgumetTypes => {
    const callRequests = requests.map((request, i) => {
      const methodInputArgumentTypes = inputArgumetTypes[i];

      if (!request.inputArguments || request.inputArguments.length === 0) {
        if (methodInputArgumentTypes.length !== 0) {
          throw new Error(`Method ${request.methodId} requires inputArguments`);
        }

        return {
          objectId: request.objectId,
          methodId: request.methodId
        };
      }

      if (methodInputArgumentTypes.length != request.inputArguments.length) {
        throw new Error(`Input arguments array of the method ${request.methodId} has a wrong length`);
      }

      // Map JSON input args to Variants
      const inputArgs = request.inputArguments.map((arg, j) => {
        const dataType = methodInputArgumentTypes[j].dataType;

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
