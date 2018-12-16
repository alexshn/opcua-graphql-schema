"use strict";
const gql = require("graphql-tag");
const getFieldNames = require("graphql-list-fields");
const { NodeClass, AttributeIds } = require("node-opcua-data-model");
const { StatusCodes } = require("node-opcua-status-code");
const utils = require("./utils");

//------------------------------------------------------------------------------
// Type definition
//------------------------------------------------------------------------------

const typeDefs = gql`
  type Query {
    node(nodeId: NodeId!): Base
    nodes(nodeIds: [NodeId]!): [Base]
  }

  """
  Base NodeClass from which all other NodeClasses are derived
  """
  interface Base {
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32
  }

  """
  Object NodeClass is used to represent systems, system components,
  real-world objects and software objects
  """
  type Object implements Base {
    # Base NodeClass attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # Object attributes
    eventNotifier: Byte
  }

`;

module.exports.typeDefs = typeDefs;

//------------------------------------------------------------------------------
// Resolvers
//------------------------------------------------------------------------------

function queryNodeAttributes(nodes, context, ast) {
  const { session } = context.opcua;

  // Get attribute list from request fields
  // Always request NodeClass since it's required to resolve node type
  // Also by requesting NodeClass we make sure that nodeId is valid
  const attributes = getFieldNames(ast).reduce((result, field) => {
    // Skip nodeId (it's already known) and nodeClass (it's always requested).
    field === "nodeId" || field === "nodeClass" || result.push(field);
    return result;
  }, ["nodeClass"]);

  const attributeIndices = attributes.map(
    attr => AttributeIds[utils.upperFirstLetter(attr)]);

  // Make request
  const nodesToRead = [];
  for(const node of nodes) {
    for(const attrIdx of attributeIndices) {
      nodesToRead.push({
        nodeId: node,
        attributeId: attrIdx,
        indexRange: null,
        dataEncoding: {namespaceIndex: 0, name: null}
      });
    }
  }

  // Submit request and handle response
  return session.read(nodesToRead).then(dataValues => {
    let index = 0;
    const result = [];

    for(const node of nodes) {
      const data = {nodeId: node};

      for(const attr of attributes) {
        data[attr] = dataValues[index++];
      }

      // nodeClass must be provided
      if (data.nodeClass && data.nodeClass.statusCode.equals(StatusCodes.Good)
        && data.nodeClass.value && data.nodeClass.value.value > 0) {
        result.push(data);
      }
    }

    return result;
  });
}

function queryNode(parent, args, context, ast) {
  return queryNodeAttributes([args.nodeId], context, ast).then(result => {
    if(result.length === 0) {
      throw new Error(StatusCodes.BadNodeIdUnknown.description);
    }
    return result[0];
  });
}

function queryNodes(parent, args, context, ast) {
  return queryNodeAttributes(args.nodeIds, context, ast);
}

function resolveNodeType(parent, args, context) {
  return NodeClass.get(parent.nodeClass.value.value).key;
}

function resolveDataValueToValue(parent, args, context, ast) {
  const data = parent[ast.fieldName];
  return data.statusCode.equals(StatusCodes.Good) ? data.value.value : null;
}

function resolveDataValueToVariant(parent, args, context, ast) {
  const data = parent[ast.fieldName];
  return data.statusCode.equals(StatusCodes.Good) ? data.value : null;
}

const resolvers = {
  Query: {
    node: queryNode,
    nodes: queryNodes,
  },

  Base: {
    __resolveType:  resolveNodeType,
  },

  Object: {
    nodeClass:      resolveDataValueToValue,
    browseName:     resolveDataValueToValue,
    displayName:    resolveDataValueToValue,
    description:    resolveDataValueToValue,
    writeMask:      resolveDataValueToValue,
    userWriteMask:  resolveDataValueToValue,

    eventNotifier:  resolveDataValueToValue,
  },
};

module.exports.resolvers = resolvers;
