"use strict";
const gql = require("graphql-tag");
const { GraphQLScalarType, Kind,
        GraphQLString,
        GraphQLBoolean,
        GraphQLFloat } = require('graphql');
const { QualifiedName,
        LocalizedText,
        coerceQualifyName,
        coerceLocalizedText } = require("node-opcua-data-model");
const { isValidGuid } = require("node-opcua-guid");
const { resolveNodeId, NodeId } = require("node-opcua-nodeid");
const { Variant, DataType, VariantArrayType } = require("node-opcua-variant");

//------------------------------------------------------------------------------
// Type definition
//------------------------------------------------------------------------------

const typeDefs = gql`
  scalar SByte
  scalar Byte
  scalar Int16
  scalar UInt16
  scalar Int32
  scalar UInt32
  scalar Int64
  scalar UInt64
  scalar Double
  scalar DateTime
  scalar Guid
  scalar ByteString
  scalar XmlElement
  scalar NodeId
  # scalar ExpandedNodeId
  # scalar StatusCode
  scalar QualifiedName
  scalar LocalizedText
  # scalar DiagnosticInfo
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
    description: `OPC UA ${min ? "signed" : "unsigned"} integer between ${min} and ${max}`,
    serialize: value => value,
    parseValue: parseInteger,
    parseLiteral: ast => parseInteger(parseLiteral(ast))
  });
}

const SByteType = defineIntType("SByte", -128, 127);
const ByteType = defineIntType("Byte", 0, 255);
const Int16Type = defineIntType("Int16", -32768, 32767);
const UInt16Type = defineIntType("UInt16", 0, 65535);
const Int32Type = defineIntType("Int32", -2147483648, 2147483647);
const UInt32Type = defineIntType("UInt32", 0, 4294967295);

// Int64, UInt64
function parseInt64(value) {
  if (!(value instanceof Array && value.length === 2)) {
    throw new Error("Int64 and UInt64 must be an array of high and low 32-bit components.");
  }

  value.forEach(part => {
    if(!Number.isInteger(part) || part < 0 || part > 0xffffffff) {
      throw new Error("Int64 and UInt64 components must be 32-bit unsinged integers.");
    }
  });

  return value;
}

const Int64Type = new GraphQLScalarType({
  name: "Int64",
  description: "OPC UA signed 64-bit integer encoded as an array of high and low 32-bit components.",
  serialize: value => value,
  parseValue: parseInt64,
  parseLiteral: (ast, vars) => parseInt64(parseLiteral(ast, vars))
});

const UInt64Type = new GraphQLScalarType({
  name: "UInt64",
  description: "OPC UA unsigned 64-bit integer encoded as an array of high and low 32-bit components.",
  serialize: value => value,
  parseValue: parseInt64,
  parseLiteral: (ast, vars) => parseInt64(parseLiteral(ast, vars))
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
  description: "OPC UA floating-point number with double precision",
  serialize: value => value,
  parseValue: parseDouble,
  parseLiteral: (ast, vars) => parseDouble(parseLiteral(ast, vars))
});

// DateTime
function parseDateTime(value) {
  if (typeof value === "string") {
    var date = new Date(value);

    if(!isNaN(date.getTime())) {
      return date;
    }
  }

  throw new Error("DateTime must be encoded as a string in simplified extended ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)");
}

const DateTimeType = new GraphQLScalarType({
  name: "DateTime",
  description: "OPC UA Gregorian calendar date encoded as a string in simplified extended ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)",
  serialize: value => value.toJSON(),
  parseValue: parseDateTime,
  parseLiteral: (ast, vars) => parseDateTime(parseLiteral(ast, vars))
});

// Guid
function parseGuid(value) {
  if (typeof value === "string" && isValidGuid(value)) {
    return value;
  }

  throw new Error("Guid must be encoded as a string in format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX");
}

const GuidType = new GraphQLScalarType({
  name: "Guid",
  description: "OPC UA 128-bit Globally Unique Identifier encoded as a string in format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  serialize: value => value,
  parseValue: parseGuid,
  parseLiteral: (ast, vars) => parseGuid(parseLiteral(ast, vars))
});

// ByteString
function parseByteString(value) {
  if (typeof value === "string") {
    // Buffer.from('base64') just swallows any invalid characters
    // See https://github.com/nodejs/node/issues/24722
    return Buffer.from(value, "base64");
  }

  throw new Error("ByteString must be encoded as a base64 string");
}

const ByteStringType = new GraphQLScalarType({
  name: "ByteString",
  description: "OPC UA sequence of Byte values encoded as a base64 string",
  serialize: value => value.toString("base64"),
  parseValue: parseByteString,
  parseLiteral: (ast, vars) => parseByteString(parseLiteral(ast, vars))
});

// XmlElement
const XmlElementType = new GraphQLScalarType({
  name: "XmlElement",
  description: "OPC UA XML fragment serialized as UTF-8 string",
  serialize: GraphQLString.serialize,
  parseValue: GraphQLString.parseValue,
  parseLiteral: GraphQLString.parseLiteral
});

// NodeId is represented as a String with the syntax:
// ns=<namespaceindex>;<type>=<value>
// Example: "ns=1;i=123"
// If this is ExpandedNodeId the string can also have namespaceUri and serverIndex
// It is also possible to use SymbolName for input values as definded in:
// http://www.opcfoundation.org/UA/schemas/NodeIds.csv
function parseNodeId(value) {
  if (typeof value !== "string") {
    throw new Error("NodeId must be encoded as a string");
  }
  return resolveNodeId(value);
}

const NodeIdType = new GraphQLScalarType({
  name: "NodeId",
  description: "OPC UA NodeId encoded as a string",
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
    throw new Error("QualifiedName must be encodeda as a string");
  }
  return coerceQualifyName(value);
}

const QualifiedNameType = new GraphQLScalarType({
  name: "QualifiedName",
  description: "OPC UA QualifiedName encoded as a string",
  serialize: value => value.toString(),
  parseValue: parseQualifiedName,
  parseLiteral: (ast, vars) => parseQualifiedName(parseLiteral(ast, vars))
});

// LocalizedText is represented as a String (locale id is omitted).
// Also the String should be provided as an input (null locale will be used).
function parseLocalizedText(value) {
  if (typeof value !== "string") {
    throw new Error("LocalizedText must be encoded as a string");
  }
  return coerceLocalizedText(value);
}

const LocalizedTextType = new GraphQLScalarType({
  name: "LocalizedText",
  description: "OPC UA LocalizedText encoded as a string",
  serialize: value => value.text,
  parseValue: parseLocalizedText,
  parseLiteral: (ast, vars) => parseLocalizedText(parseLiteral(ast, vars))
});


// Variant type
// Implementation of Variant is not symmetric.
// Parse methods return JSON instead of opcua.Variant since
// at the moment of parsing we don't have type information.
// Each method that has Variant as an input has to convert JSON to opcua.Variant

function serializeVariant(variant) {
  if (!(variant instanceof Variant)) {
    throw new Error("opcua.Variant value is expected");
  }

  const serializeMethod = getScalarType(variant.dataType).serialize;

  if (variant.arrayType === VariantArrayType.Scalar) {
    return serializeMethod(variant.value);
  }

  // If VariantArrayType.Array or VariantArrayType.Matrix
  let serializedArray =
    (ArrayBuffer.isView(variant.value) ? Array.from(variant.value) : variant.value).map(serializeMethod);

  if (!variant.dimensions || variant.dimensions.length <= 1) {
    return serializedArray;
  }

  // if VariantArrayType.Matrix
  for(let i = 1; i < variant.dimensions.length; i++) {
    const dim = variant.dimensions[variant.dimensions.length - i];

    const result = [];
    for (let j = 0; j < serializedArray.length; j += dim) {
      result.push(serializedArray.slice(j, j + dim));
    }

    serializedArray = result;
  }

  return serializedArray;
}

function calcDimensions(value) {
  if(Array.isArray(value)) {
    const dimensions = value.length > 0 ? calcDimensions(value[0]) : [];
    dimensions.unshift(value.length);
    return dimensions;
  }
  return [];
}

function parseVariant(value, dataType, valueRank) {
  const parseMethod = getScalarType(dataType).parseValue;
  const valueDimensions = calcDimensions(value);

  // Remove one dimention for scalars that has array-like semantics
  if (valueDimensions.length > 0 && (dataType.value === DataType.UInt64.value
    || dataType.value === DataType.Int64.value
    || dataType.value === DataType.ByteString.value)) {
    valueDimensions.pop();
  }

  if (valueDimensions.length === 0) {
    if (valueRank >= 0) {
      throw new Error("Array value is expected but scalar is provided");
    }

    return new Variant({
      dataType: dataType,
      arrayType: VariantArrayType.Scalar,
      dimensions: null,
      value: parseMethod(value)
    });
  } else if(valueDimensions.length === 1) {
    if (valueRank > 1) {
      throw new Error(`Array with ${valueRank} dimensions is expected but array with one dimention is provided`);
    }
    if (valueRank === -1) {
      throw new Error("Scalar value is expected but array is provided");
    }

    return new Variant({
      dataType: dataType,
      arrayType: VariantArrayType.Array,
      dimensions: null,
      value: value.map(parseMethod)
    });
  } else {
    if (valueRank > 0 && valueRank !== valueDimensions.length) {
      throw new Error(`Array with ${valueRank} dimensions is expected but array with ${valueDimensions.length} dimensions is provided`);
    }
    if (valueRank === -1) {
      throw new Error("Scalar value is expected but array is provided");
    }
    if (valueRank === -3) {
      throw new Error("Scalar or array with one dimention is expected but array with multiple dimensions is provided");
    }

    // Concat arrays into single one
    let valueArray = value;
    for (let i = 0; i < valueDimensions.length - 1; i++) {
      valueArray = valueArray.reduce((v1, v2) => v1.concat(v2));
    }

    const valueArrayLen = valueDimensions.reduce((l1, l2) => l1 * l2);
    if(valueArrayLen !== valueArray.length) {
      throw new Error("Dimention lenghts of multi-dimentional array are not consistent");
    }

    const res = new Variant({
      dataType: dataType,
      arrayType: VariantArrayType.Matrix,
      dimensions: valueDimensions,
      value: valueArray.map(parseMethod)
    });

    return res;
  }
}

const VariantType = new GraphQLScalarType({
  name: "Variant",
  description: "OPC UA Variant is a union of the other built-in types",
  serialize: serializeVariant,
  parseValue: value => value,
  parseLiteral: (ast, vars) => parseLiteral(ast, vars)
});


function serializeAnyValue(value) {
  if (value instanceof NodeId) {
    return NodeIdType.serialize(value);
  } else if(value instanceof QualifiedName) {
    return QualifiedNameType.serialize(value);
  } else if(value instanceof LocalizedText) {
    return LocalizedTextType.serialize(value);
  } else if(value instanceof Date) {
    return DateTimeType.serialize(value);
  } else if(Buffer.isBuffer(value)) {
    return ByteStringType.serialize(value);
  } else if(Array.isArray(value)) {
    return value.map(serializeAnyValue);
  } else if (typeof value === 'object' && value !== null) {
    const result = {};
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        result[key] = serializeAnyValue(value[key]);
      }
    }
    return result;
  }

  return value;
}

function getScalarType(dataType) {
  switch(dataType.value) {
    case DataType.Boolean.value:
      return GraphQLBoolean;
    case DataType.SByte.value:
      return SByteType;
    case DataType.Byte.value:
      return ByteType;
    case DataType.Int16.value:
      return Int16Type;
    case DataType.UInt16.value:
      return UInt16Type;
    case DataType.Int32.value:
      return Int32Type;
    case DataType.UInt32.value:
      return UInt32Type;
    case DataType.Int64.value:
      return Int64Type;
    case DataType.UInt64.value:
      return UInt64Type;
    case DataType.Float.value:
      return GraphQLFloat;
    case DataType.Double.value:
      return DoubleType;
    case DataType.String.value:
      return GraphQLString;
    case DataType.DateTime.value:
      return DateTimeType;
    case DataType.Guid.value:
      return GuidType;
    case DataType.ByteString.value:
      return ByteStringType;
    case DataType.XmlElement.value:
      return XmlElementType;
    case DataType.NodeId.value:
      return NodeIdType;
    // ExpandedNodeId
    // StatusCode
    case DataType.QualifiedName.value:
      return QualifiedNameType;
    case DataType.LocalizedText.value:
      return LocalizedTextType;
    case DataType.Variant.value:
      return VariantType;
    // DiagnosticInfo
  }

  // DataType.ExtensionObject and unknown
  return {serialize: serializeAnyValue, parseValue: value => value};
}

const resolvers = {
  SByte: SByteType,
  Byte: ByteType,
  Int16: Int16Type,
  UInt16: UInt16Type,
  Int32: Int32Type,
  UInt32: UInt32Type,
  Int64: Int64Type,
  UInt64: UInt64Type,
  Double: DoubleType,
  DateTime: DateTimeType,
  Guid: GuidType,
  ByteString: ByteStringType,
  XmlElement: XmlElementType,
  NodeId: NodeIdType,
  QualifiedName: QualifiedNameType,
  LocalizedText: LocalizedTextType,
  Variant: VariantType
};

module.exports.resolvers = resolvers;
module.exports.parseVariant = parseVariant;
