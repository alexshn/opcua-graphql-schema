"use strict";
const gql = require("graphql-tag");
const { NodeClass } = require("node-opcua-data-model");

const typeDefs = gql`
  type Query {
    node(nodeId: NodeId!): Base
    nodes(nodeIds: [NodeId]!): [Base]
  }

  """
  Base NodeClass from which all other NodeClasses are derived.
  """
  interface Base {
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
  }

  """
  Object NodeClass is used to represent systems, system components,
  real-world objects and software objects.
  """
  type Object implements Base {
    nodeId: NodeId!
    nodeClass: NodeClass!
    browseName: QualifiedName!
    displayName: LocalizedText!
    description: LocalizedText
  }
`;

function queryNode(parent, args, context) {
  const { session } = context.opcua;
  return session.readAllAttributes(args.nodeId);
}

function queryNodes(parent, args, context) {
  const { session } = context.opcua;
  return session.readAllAttributes(args.nodeIds);
}

function resolveNodeType(parent, args, context) {
  return NodeClass.get(parent.nodeClass).key;
}

const resolvers = {
  Query: {
    node: queryNode,
    nodes: queryNodes,
  },

  Base: {
    __resolveType: resolveNodeType,
  },
};


module.exports.typeDefs = typeDefs;
module.exports.resolvers = resolvers;
