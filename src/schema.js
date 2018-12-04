"use strict";
const gql = require("graphql-tag");
const { makeExecutableSchema } = require('graphql-tools');

const nodes = require("./nodes");
const enums = require("./enums");
const scalars = require("./scalars");

const typeDefs = gql`
  type Query {
    node(nodeId: NodeId!): Base
    nodes(nodeIds: [NodeId]!): [Base]
  }
`;

const resolvers = {
  Query: {
    node: nodes.queryNode,
    nodes: nodes.queryNodes,
  },
};

function makeOPCUASchema() {
  return makeExecutableSchema({
    typeDefs: [
      typeDefs,
      nodes.typeDefs,
      enums.typeDefs,
      scalars.typeDefs
    ],
    resolvers: Object.assign({},
      resolvers,
      nodes.resolvers,
      enums.resolvers,
      scalars.resolvers
    )
  });
}

function makeOPCUAContext(options) {
  return {
    opcua: {
      session: options.session
    }
  }
}

module.exports.makeOPCUASchema = makeOPCUASchema;
module.exports.makeOPCUAContext = makeOPCUAContext;
