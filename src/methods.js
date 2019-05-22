"use strict";
const gql = require("graphql-tag");
const { resolveNodeId } = require("node-opcua-nodeid");
const { NodeClassMask,
        BrowseDirection,
        ResultMask,
        AttributeIds } = require("node-opcua-data-model");
const { StatusCodes } = require("node-opcua-status-code");
const { Variant, DataType } = require("node-opcua-variant");
const { parseVariant } = require("./scalars");

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

// Request InputArguments variables for given methods
// InputArguments is a property (variable) of Method class
function requestInputArguments(context, methodIds) {
  const { session } = context.opcua;

  if (methodIds.length === 0) {
    return Promise.resolve([]);
  }

  // Browse InputAgrument property of method
  const methodsToBrowse = methodIds.map(methodId => ({
    nodeId: methodId,
    referenceTypeId: "HasProperty",
    includeSubtypes: true,
    browseDirection: BrowseDirection.Forward,
    nodeClassMask: NodeClassMask.Variable,
    resultMask: ResultMask.BrowseName
  }));

  return session.browse(methodsToBrowse).then(browseResults => {
    const nodeIds = methodIds.map((method, i) => {
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

// Get cached InputArguments property of methods
// If the value is not cached request it from server
function getCachedInputArguments(context, methodIds) {
  const { typeCache } = context.opcua;

  if (!typeCache) {
    return requestInputArguments(context, methodIds);
  }

  // Get data from cache and list of non-cached items
  const result = new Array(methodIds.length);
  const nonCached = [];
  const nonCachedIdx = [];

  methodIds.forEach((methodId, i) => {
    const cached = typeCache.get(methodId.toString());
    if (cached) {
      result[i] = cached;
    } else {
      nonCached.push(methodId);
      nonCachedIdx.push(i);
    }
  });

  // All data hits the cache
  if (nonCached.length === 0) {
    return Promise.resolve(result);
  }

  // Request non-cached data from server
  return requestInputArguments(context, nonCached).then(nonCachedResult => {
    nonCachedResult.forEach((ncRes, i) => {
      result[nonCachedIdx[i]] = ncRes;
      typeCache.set(nonCached[i].toString(), ncRes);
    });

    return result;
  });
}

// Internal implementation of method call
function callMethodsInternal(requests, context) {
  const { session } = context.opcua;
  const methods = requests.map(request => request.methodId);

  // Request input argument types.
  // This is required to convert input JSON to node-opcua Variant.
  return getCachedInputArguments(context, methods).then(inputArgumentProp => {
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
  return callMethodsInternal([args.methodToCall], context).then(results => results[0]);
}

function callMethods(parent, args, context, ast) {
  return callMethodsInternal(args.methodsToCall, context);
}

const resolvers = {
  Mutation: {
    callMethod: callMethod,
    callMethods: callMethods,
  },
};

module.exports.resolvers = resolvers;
