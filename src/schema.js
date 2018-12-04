"use strict";
const gql = require("graphql-tag");
const { makeExecutableSchema } = require('graphql-tools');

const nodes = require("./nodes");
const enums = require("./enums");
const scalars = require("./scalars");

function makeOPCUASchema() {
  return makeExecutableSchema({
    typeDefs: [
      nodes.typeDefs,
      enums.typeDefs,
      scalars.typeDefs
    ],
    resolvers: [
      nodes.resolvers,
      enums.resolvers,
      scalars.resolvers
    ]
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
