"use strict";
const nodes = require("./src/nodes");
const enums = require("./src/enums");
const scalars = require("./src/scalars");
const methods = require("./src/methods");
const subscriptions = require("./src/subscriptions");
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
      scalars.typeDefs,
      methods.typeDefs,
      subscriptions.typeDefs
    ],
    resolvers: [
      nodes.resolvers,
      enums.resolvers,
      scalars.resolvers,
      methods.resolvers,
      subscriptions.resolvers
    ]
  });
}

/**
 * Creates a context for GraphQL schema execution.
 * @method makeOPCUAContext
 * @param options {Object} an object of options
 * @param options.session {ClientSession} node-opcua session object
 * @param options.typeCache {Map} Map-like cache for OPC UA type info
 * Cache examples:
 * https://www.npmjs.com/package/node-cache
 * https://www.npmjs.com/package/caching-map
 */
function makeOPCUAContext(options) {
  return {
    opcua: {
      session: options.session,
      typeCache: options.typeCache,
    }
  }
}


module.exports.makeOPCUASchema = makeOPCUASchema;
module.exports.makeOPCUAContext = makeOPCUAContext;
