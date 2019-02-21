"use strict";
const { NodeClassMask,
        BrowseDirection,
        ResultMask,
        AttributeIds } = require("node-opcua-data-model");
const { StatusCodes } = require("node-opcua-status-code");

class DataTypeCache {
  constructor() {
    this.dataTypes = new Map();
    this.inputArguments = new Map();
  }

  getDataTypeInfo(dataTypeId) {
    return this.dataTypes.get(dataTypeId.toString());
  }

  putDataTypeInfo(dataTypeId, info) {
    this.dataTypes.set(dataTypeId.toString(), info);
  }

  getMethodInputArgs(methodId) {
    return this.inputArguments.get(methodId.toString());
  }

  putMethodInputArgs(methodId, inputArgs) {
    this.inputArguments.set(methodId.toString(), inputArgs);
  }
}

// Get info for data types
DataTypeCache.getDataTypeInfo = function(context, dataTypeIds) {
  // TODO: return [{dataTypeId, buildInType, binaryEncoding, xmlEncoding}]
}

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

// Get info for input arguments of methods
DataTypeCache.getInputArgumentsInfo = function(context, methodIds) {
  const { dataTypeCache } = context.opcua;

  if (!dataTypeCache) {
    return requestInputArguments(context, methodIds);
  }

  // TODO: optimize it...
  const nonCachedIds = methodIds.filter(methodId => !dataTypeCache.getMethodInputArgs(methodId));

  return requestInputArguments(context, nonCachedIds).then(nonCachedResult => {
    // Put values to cache
    nonCachedIds.forEach((methodId, i) => {
      dataTypeCache.putMethodInputArgs(methodId, nonCachedResult[i]);
    });

    // Get full result from cache
    return methodIds.map(methodId => dataTypeCache.getMethodInputArgs(methodId));
  });
}

module.exports.DataTypeCache = DataTypeCache;
