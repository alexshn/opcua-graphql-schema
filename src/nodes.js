"use strict";
const gql = require("graphql-tag");
const { NodeClass } = require("node-opcua-data-model");

const typeDefs = gql`
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

const resolvers = {
  Base: {
    __resolveType(obj, context, info) {
      return NodeClass.get(obj.nodeClass).key;
    },
  },
};

function queryNode(parent, args, context) {
  const { session } = context.opcua;
  return session.readAllAttributes(args.nodeId);
}

function queryNodes(parent, args, context) {
  const { session } = context.opcua;
  return session.readAllAttributes(args.nodeIds);
}


module.exports.typeDefs = typeDefs;
module.exports.resolvers = resolvers;

module.exports.queryNode = queryNode;
module.exports.queryNodes = queryNodes;
