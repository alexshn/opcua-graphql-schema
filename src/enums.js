"use strict";
const gql = require("graphql-tag");
const { NodeClass } = require("node-opcua-data-model");

//------------------------------------------------------------------------------
// Type definition
//------------------------------------------------------------------------------

const typeDefs = gql`
  enum NodeClass {
    Unspecified
    Object
    Variable
    Method
    ObjectType
    VariableType
    ReferenceType
    DataType
    View
  }
`;

module.exports.typeDefs = typeDefs;

//------------------------------------------------------------------------------
// Resolvers
//------------------------------------------------------------------------------

const NodeClassEnum = {
  Unspecified:    NodeClass.Unspecified.value,
  Object:         NodeClass.Object.value,
  Variable:       NodeClass.Variable.value,
  Method:         NodeClass.Method.value,
  ObjectType:     NodeClass.ObjectType.value,
  VariableType:   NodeClass.VariableType.value,
  ReferenceType:  NodeClass.ReferenceType.value,
  DataType:       NodeClass.DataType.value,
  View:           NodeClass.View.value,
};


const resolvers = {
  NodeClass: NodeClassEnum
};

module.exports.resolvers = resolvers;
