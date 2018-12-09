"use strict";
const nodes = require("./src/nodes");
const enums = require("./src/enums");
const scalars = require("./src/scalars");
const { makeExecutableSchema } = require('graphql-tools');

/**
 * Creates a GraphQL schema for OPC UA address space model.
 * @method makeOPCUASchema
 * @param options {Object} an object of options
 */
function makeOPCUASchema(options) {
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

/**
 * Creates a context for GraphQL schema execution.
 * @method makeOPCUAContext
 * @param options {Object} an object of options
 * @param options.session {ClientSession} node-opcua session object
 */
function makeOPCUAContext(options) {
  return {
    opcua: {
      session: options.session
    }
  }
}


module.exports.makeOPCUASchema = makeOPCUASchema;
module.exports.makeOPCUAContext = makeOPCUAContext;