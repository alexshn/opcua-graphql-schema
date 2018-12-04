"use strict";
const gql = require("graphql-tag");
const { GraphQLScalarType, Kind } = require('graphql');
const { resolveNodeId } = require("node-opcua-nodeid");
const { coerceQualifyName, coerceLocalizedText } = require("node-opcua-data-model");

const typeDefs = gql`
  scalar NodeId
  scalar LocaleId
  scalar QualifiedName
  scalar LocalizedText

  # Any scalar type (testing only)
  scalar Any
`;

const NodeIdType = new GraphQLScalarType({
  name: "NodeId",
  description: "OPC UA NodeId type",
  serialize(value) {
    return value.toString();
  },
  parseValue(value) {
    return resolveNodeId(value);
  },
  parseLiteral(ast) {
    return (ast.kind === Kind.STRING) ? resolveNodeId(ast.value) : null;
  }
});

const LocaleIdType = new GraphQLScalarType({
  name: 'LocaleId',
  description: 'OPC UA LocaleId type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    return (ast.kind === Kind.STRING) ? ast.value : null;
  }
});

const QualifiedNameType = new GraphQLScalarType({
  name: 'QualifiedName',
  description: 'OPC UA QualifiedName type',
  serialize(value) {
    return value.toString();
  },
  parseValue(value) {
    return coerceQualifyName(value);
  },
  parseLiteral(ast) {
    return (ast.kind === Kind.STRING) ? coerceQualifyName(ast.value) : null;
  }
});

const LocalizedTextType = new GraphQLScalarType({
  name: 'LocalizedText',
  description: 'OPC UA LocalizedText type',
  serialize(value) {
    return value.text;
  },
  parseValue(value) {
    return opcua.coerceLocalizedText(value);
  },
  parseLiteral(ast) {
    return (ast.kind === Kind.STRING) ? ast.value : null;
  }
});

function parseAnyLiteral(ast, variables) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const value = Object.create(null);
      ast.fields.forEach(field => {
        value[field.name.value] = parseAnyLiteral(field.value, variables);
      });

      return value;
    }
    case Kind.LIST:
      return ast.values.map(n => parseAnyLiteral(n, variables));
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

const AnyType = new GraphQLScalarType({
  name: 'Any',
  description: 'OPC UA Any type (testing only)',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral: parseAnyLiteral
});

const resolvers = {
  NodeId: NodeIdType,
  LocaleId: LocaleIdType,
  QualifiedName: QualifiedNameType,
  LocalizedText: LocalizedTextType,

  Any: AnyType,
};

module.exports.typeDefs = typeDefs;
module.exports.resolvers = resolvers;
