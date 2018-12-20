"use strict";
const gql = require("graphql-tag");
const { GraphQLScalarType, Kind } = require('graphql');
const { resolveNodeId } = require("node-opcua-nodeid");
const { Variant, DataType, VariantArrayType } = require("node-opcua-variant");
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
  scalar Float
  scalar Double
  scalar Variant
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
  description: "OPC UA NodeId type",
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
  description: "OPC UA QualifiedName type",
  serialize: value => value.toString(),
  parseValue: parseQualifiedName,
  parseLiteral: (ast, vars) => parseQualifiedName(parseLiteral(ast, vars))
});

// LocalizedText is represented as a String (locale id is omitted).
// Also the String should be provided as an input (null locale will be used).
function parseLocalizedText(value) {
  if (typeof value !== "string") {
    throw new Error("LocalizedText must be a string");
  }
  return coerceLocalizedText(value);
}

const LocalizedTextType = new GraphQLScalarType({
  name: "LocalizedText",
  description: "OPC UA LocalizedText type",
  serialize: value => value.text,
  parseValue: parseLocalizedText,
  parseLiteral: (ast, vars) => parseLocalizedText(parseLiteral(ast, vars))
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

const SByteType = defineIntType("SByte", -128, 127);
const Int16Type = defineIntType("Int16", -32768, 32767);
const Int32Type = defineIntType("Int32", -2147483648, 2147483647);
const ByteType = defineIntType("Byte", 0, 255);
const UInt16Type = defineIntType("UInt16", 0, 65535);
const UInt32Type = defineIntType("UInt32", 0, 4294967295);

// Float type
function parseOPCFloat(value) {
  if (typeof value !== "number") {
    throw new Error("Float must be a number");
  }
  return value;
}

const FloatType = new GraphQLScalarType({
  name: "Float",
  description: "OPC UA Float type",
  serialize: value => value,
  parseValue: parseOPCFloat,
  parseLiteral: (ast, vars) => parseOPCFloat(parseLiteral(ast, vars))
});

// Double type
function parseDouble(value) {
  if (typeof value !== "number") {
    throw new Error("Double must be a number");
  }
  return value;
}

const DoubleType = new GraphQLScalarType({
  name: "Double",
  description: "OPC UA Double type",
  serialize: value => value,
  parseValue: parseDouble,
  parseLiteral: (ast, vars) => parseDouble(parseLiteral(ast, vars))
});


// Variant type
// Implementation of Variant is not symmetric.
// Parse methods return JSON instead of opcua.Variant since
// at the moment of parsing we don't have type information.
// Each method that has Variant as an input has to convert JSON to opcua.Variant

function serializeVariantValue(value, dataType) {
  switch(dataType) {
    case DataType.Boolean:
      return !!value;
    case DataType.SByte:
      return SByteType.serialize(value);
    case DataType.Byte :
      return ByteType.serialize(value);
    case DataType.Int16:
      return Int16Type.serialize(value);
    case DataType.UInt16:
      return UInt16Type.serialize(value);
    case DataType.Int32:
      return Int32Type.serialize(value);
    case DataType.UInt32:
      return UInt32Type.serialize(value);
    case DataType.Float:
      return FloatType.serialize(value);
    case DataType.Double:
      return DoubleType.serialize(value);
    case DataType.String:
      return value;
    case DataType.NodeId:
      return NodeIdType.serialize(value);
    case DataType.QualifiedName:
      return QualifiedNameType.serialize(value);
    case DataType.LocalizedText:
      return LocalizedTextType.serialize(value);
    case DataType.Variant:
      return serializeVariant(value);
  }

  throw new Error("Unknown data type of Variant value");
}

function serializeVariant(variant) {
  if (!(variant instanceof Variant)) {
    throw new Error("opcua.Variant value expected");
  }

  if (variant.arrayType === VariantArrayType.Scalar) {
    return serializeVariantValue(variant.value, variant.dataType);
  }

  const serializedArray = variant.value.map(
    value => serializeVariantValue(value, variant.dataType));

  if (variant.arrayType === VariantArrayType.Array) {
    return serializedArray;
  }

  // if VariantArrayType.Matrix
  for(i = 1; i < variant.dimensions.length; i++) {
    const dimHi = variant.dimensions[variant.dimensions.length - i];
    const dimLo = variant.dimensions[variant.dimensions.length - i - 1];

    const result = [];
    for (j = 0; j < dimLo; j++) {
      const idx = j * dimHi;
      result.push(serializedArray.slice(idx, idx + dimHi));
    }

    serializedArray = result;
  }

  return serializedArray;
}

const VariantType = new GraphQLScalarType({
  name: "Variant",
  description: "OPC UA Variant is a union of the other built-in types",
  serialize: serializeVariant,
  parseValue: value => value,
  parseLiteral: (ast, vars) => parseLiteral(ast, vars)
});


const resolvers = {
  NodeId: NodeIdType,
  QualifiedName: QualifiedNameType,
  LocalizedText: LocalizedTextType,
  SByte: SByteType,
  Int16: Int16Type,
  Int32: Int32Type,
  Byte: ByteType,
  UInt16: UInt16Type,
  UInt32: UInt32Type,
  Float: FloatType,
  Double: DoubleType,
  Variant: VariantType
};

module.exports.resolvers = resolvers;
