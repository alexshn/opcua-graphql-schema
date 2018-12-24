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
    # Base attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # Object attributes
    eventNotifier: Byte!
  }

  """
  ObjectType NodeClass provides definition for Objects
  """
  type ObjectType implements Base {
    # Base attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # ObjectType attributes
    isAbstract: Boolean!
  }

  """
  ReferenceType NodeClass provides definition for References
  """
  type ReferenceType implements Base {
    # Base attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # ReferenceType attributes
    isAbstract: Boolean!
    symmetric: Boolean!
    inverseName: LocalizedText
  }

  """
  Variable NodeClass is used to represent value which may be simple or complex
  """
  type Variable implements Base {
    # Base attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # Variable attributes
    value: Variant!
    dataType: NodeId!
    valueRank: Int32!
    arrayDimensions: [UInt32]
    accessLevel: Byte!
    userAccessLevel: Byte!
    minimumSamplingInterval: Double
    historizing: Boolean!
  }

  """
  VariableType NodeClass provides definition for Variables
  """
  type VariableType implements Base {
    # Base attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # VariableType attributes
    value: Variant
    dataType: NodeId!
    valueRank: Int32!
    arrayDimensions: [UInt32]
    isAbstract: Boolean!
  }

  """
  DataType NodeClass describes the syntax of a Variable Value
  """
  type DataType implements Base {
    # Base attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # DataType attributes
    isAbstract: Boolean!
  }

  """
  Method NodeClass define callable functions
  """
  type Method implements Base {
    # Base attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # Method attributes
    executable: Boolean!
    userExecutable: Boolean!
  }

  """
  View NodeClass defines a subset of the Nodes in the AddressSpace
  """
  type View implements Base {
    # Base attributes
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
    writeMask: UInt32
    userWriteMask: UInt32

    # View attributes
    containsNoLoops: Boolean!
    eventNotifier: Byte!
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
  // TODO: check that context is valid
  return queryNodeAttributes([args.nodeId], context, ast).then(result => {
    return result.length > 0 ? result[0] : null;
  });
}

function queryNodes(parent, args, context, ast) {
  // TODO: check that context is valid
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
    node:                     queryNode,
    nodes:                    queryNodes,
  },

  Base: {
    __resolveType:            resolveNodeType,
  },

  Object: {
    nodeClass:                resolveDataValueToValue,
    browseName:               resolveDataValueToValue,
    displayName:              resolveDataValueToValue,
    description:              resolveDataValueToValue,
    writeMask:                resolveDataValueToValue,
    userWriteMask:            resolveDataValueToValue,

    eventNotifier:            resolveDataValueToValue,
  },

  ObjectType: {
    nodeClass:                resolveDataValueToValue,
    browseName:               resolveDataValueToValue,
    displayName:              resolveDataValueToValue,
    description:              resolveDataValueToValue,
    writeMask:                resolveDataValueToValue,
    userWriteMask:            resolveDataValueToValue,

    isAbstract:               resolveDataValueToValue,
  },

  ReferenceType: {
    nodeClass:                resolveDataValueToValue,
    browseName:               resolveDataValueToValue,
    displayName:              resolveDataValueToValue,
    description:              resolveDataValueToValue,
    writeMask:                resolveDataValueToValue,
    userWriteMask:            resolveDataValueToValue,

    isAbstract:               resolveDataValueToValue,
    symmetric:                resolveDataValueToValue,
    inverseName:              resolveDataValueToValue,
  },

  Variable: {
    nodeClass:                resolveDataValueToValue,
    browseName:               resolveDataValueToValue,
    displayName:              resolveDataValueToValue,
    description:              resolveDataValueToValue,
    writeMask:                resolveDataValueToValue,
    userWriteMask:            resolveDataValueToValue,

    value:                    resolveDataValueToVariant,
    dataType:                 resolveDataValueToValue,
    valueRank:                resolveDataValueToValue,
    arrayDimensions:          resolveDataValueToValue,
    accessLevel:              resolveDataValueToValue,
    userAccessLevel:          resolveDataValueToValue,
    minimumSamplingInterval:  resolveDataValueToValue,
    historizing:              resolveDataValueToValue,
  },

  VariableType: {
    nodeClass:                resolveDataValueToValue,
    browseName:               resolveDataValueToValue,
    displayName:              resolveDataValueToValue,
    description:              resolveDataValueToValue,
    writeMask:                resolveDataValueToValue,
    userWriteMask:            resolveDataValueToValue,

    value:                    resolveDataValueToVariant,
    dataType:                 resolveDataValueToValue,
    valueRank:                resolveDataValueToValue,
    arrayDimensions:          resolveDataValueToValue,
    isAbstract:               resolveDataValueToValue,
  },

  DataType: {
    nodeClass:                resolveDataValueToValue,
    browseName:               resolveDataValueToValue,
    displayName:              resolveDataValueToValue,
    description:              resolveDataValueToValue,
    writeMask:                resolveDataValueToValue,
    userWriteMask:            resolveDataValueToValue,

    isAbstract:               resolveDataValueToValue,
  },

  Method: {
    nodeClass:                resolveDataValueToValue,
    browseName:               resolveDataValueToValue,
    displayName:              resolveDataValueToValue,
    description:              resolveDataValueToValue,
    writeMask:                resolveDataValueToValue,
    userWriteMask:            resolveDataValueToValue,

    executable:               resolveDataValueToValue,
    userExecutable:           resolveDataValueToValue,
  },

  View: {
    nodeClass:                resolveDataValueToValue,
    browseName:               resolveDataValueToValue,
    displayName:              resolveDataValueToValue,
    description:              resolveDataValueToValue,
    writeMask:                resolveDataValueToValue,
    userWriteMask:            resolveDataValueToValue,

    containsNoLoops:          resolveDataValueToValue,
    eventNotifier:            resolveDataValueToValue,
  },

};

module.exports.resolvers = resolvers;
