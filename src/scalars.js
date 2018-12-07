"use strict";
const gql = require("graphql-tag");
const { GraphQLScalarType, Kind } = require('graphql');
const { resolveNodeId } = require("node-opcua-nodeid");
const { coerceQualifyName, coerceLocalizedText } = require("node-opcua-data-model");

//------------------------------------------------------------------------------
// Type definition
//------------------------------------------------------------------------------

const typeDefs = gql`
  scalar NodeId
  scalar QualifiedName
  scalar LocalizedText
  scalar SByte
  scalar Int16
  scalar Int32
  scalar Byte
  scalar UInt16
  scalar UInt32
`;

module.exports.typeDefs = typeDefs;

//------------------------------------------------------------------------------
// Resolvers
//------------------------------------------------------------------------------

function parseLiteral(ast, variables) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
      return parseInt(ast.value, 10);
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const value = {};
      ast.fields.forEach(field => {
        value[field.name.value] = parseLiteral(field.value, variables);
      });
      return value;
    }
    case Kind.LIST:
      return ast.values.map(n => parseLiteral(n, variables));
    case Kind.NULL:
      return null;
    case Kind.VARIABLE: {
      const name = ast.name.value;
      return variables ? variables[name] : undefined;
    }
    default:
      return undefined;
  }
}

// NodeId is represented as a String with the syntax:
// ns=<namespaceindex>;<type>=<value>
// Example: "ns=1;i=123"
// It is also possible to use SymbolName for input values as definded in:
// http://www.opcfoundation.org/UA/schemas/NodeIds.csv
function parseNodeId(value) {
  if (typeof value !== "string") {
    throw new Error("NodeId must be a string");
  }
  return resolveNodeId(value);
}

const NodeIdType = new GraphQLScalarType({
  name: "NodeId",
  description: "OPC UA NodeId type (serialized to String)",
  serialize: value => value.toString(),
  parseValue: parseNodeId,
  parseLiteral: (ast, vars) => parseNodeId(parseLiteral(ast, vars))
});

// QualifiedName is represented as a String with the syntax:
// <namespaceindex>:<name>
// Namespace 0 can be omitted
// Example: "FolderType", "1:Temperature"
function parseQualifiedName(value) {
  if (typeof value !== "string") {
    throw new Error("QualifiedName must be a string");
  }
  return coerceQualifyName(value);
}

const QualifiedNameType = new GraphQLScalarType({
  name: "QualifiedName",
  description: "OPC UA QualifiedName type (serialized to String)",
  serialize: value => value.toString(),
  parseValue: parseQualifiedName,
  parseLiteral: (ast, vars) => parseQualifiedName(parseLiteral(ast, vars))
});

// LocalizedText is represented as an Object with locale and text properties.
// Also the String can be provided as an input (null locale will be used).
const LocalizedTextType = new GraphQLScalarType({
  name: "LocalizedText",
  description: "OPC UA LocalizedText type",
  serialize: value => value,
  parseValue: coerceLocalizedText,
  parseLiteral: (ast, vars) => coerceLocalizedText(parseLiteral(ast, vars))
});

// Integer types
function defineIntType(name, min, max) {
  function parseInteger(value) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${name} must be an integer between ${min} and ${max}`);
    }
    return value;
  }

  return new GraphQLScalarType({
    name,
    description: `${min ? "Signed" : "Unsigned"} integer between ${min} and ${max}`,
    serialize: value => value,
    parseValue: parseInteger,
    parseLiteral: ast => parseInteger(parseLiteral(ast))
  });
}


const resolvers = {
  NodeId: NodeIdType,
  QualifiedName: QualifiedNameType,
  LocalizedText: LocalizedTextType,
  SByte: defineIntType("SByte", -128, 127),
  Int16: defineIntType("Int16", -32768, 32767),
  Int32: defineIntType("Int32", -2147483648, 2147483647),
  Byte: defineIntType("Byte", 0, 255),
  UInt16: defineIntType("UInt16", 0, 65535),
  UInt32: defineIntType("UInt32", 0, 4294967295),
};

module.exports.resolvers = resolvers;
