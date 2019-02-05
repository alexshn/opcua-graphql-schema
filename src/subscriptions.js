"use strict";
const gql = require("graphql-tag");
const getFieldNames = require("graphql-list-fields");
const { AttributeIds } = require("node-opcua-data-model");
const { StatusCodes } = require("node-opcua-status-code");
const { constructEventFilter } = require("node-opcua-service-filter");
const { NotificationDataIterator } = require('./notification-data-iterator');
const utils = require("./utils");

//------------------------------------------------------------------------------
// Type definition
//------------------------------------------------------------------------------

const typeDefs = gql`
  input MonitoringParameters {
    publishingInterval: Double # fixme: Duration
    priority: Byte
    queueSize: UInt32 # fixme: Counter
    discardOldest: Boolean
  }

  type ValueUpdate {
    nodeId: NodeId!
    value: Variant
  }

  type Event {
    nodeId: NodeId!
    #eventId: ByteString
    eventType: NodeId
    sourceNode: NodeId
    sourceName: String
    #time: UtcTime
    #receiveTime: UtcTime
    #localTime: TimeZoneDataType
    message: LocalizedText
    severity: UInt16
  }

  type Subscription {
    monitorVariable(nodeId: NodeId!, parameters: MonitoringParameters): ValueUpdate
    monitorVariables(nodeIds: [NodeId]!, parameters: MonitoringParameters): ValueUpdate

    monitorEventSource(nodeId: NodeId!, parameters: MonitoringParameters): Event
    monitorEventSources(nodeIds: [NodeId]!, parameters: MonitoringParameters): Event
  }
`;

module.exports.typeDefs = typeDefs;

//------------------------------------------------------------------------------
// Resolvers
//------------------------------------------------------------------------------

//
// Variable subscription
//

function subscribeVariableInternal(name, session, itemsToMonitor, parameters) {
  parameters = parameters || {};

  const subscriptionParameters = {
    requestedPublishingInterval: parameters.publishingInterval == null ? 1000 : parameters.publishingInterval,
    requestedLifetimeCount: 60,
    requestedMaxKeepAliveCount: 10,
    maxNotificationsPerPublish: 0,
    publishingEnabled: true,
    priority: parameters.priority || 0
  };

  const monitorParameters = {
    samplingInterval: -1, // the same as publishingInterval
    queueSize: parameters.queueSize || 0,
    discardOldest: parameters.discardOldest == null ? true : parameters.discardOldest
  };

  return new NotificationDataIterator(session, itemsToMonitor, subscriptionParameters,
    monitorParameters, (monitoredItem, dataValue, index) => {
      return {[name]: {
        nodeId: monitoredItem.itemToMonitor.nodeId,
        value: dataValue.statusCode.equals(StatusCodes.Good) ? dataValue.value : null
      }};
    }
  );
}

function subscribeVariable(parent, args, context, ast) {
  const { session } = context.opcua;

  const itemsToMonitor = [{
    nodeId: args.nodeId,
    attributeId: AttributeIds.Value
  }];

  return subscribeVariableInternal("monitorVariable", session, itemsToMonitor, args.parameters);
}

function subscribeVariables(parent, args, context, ast) {
  const { session } = context.opcua;

  const itemsToMonitor = args.nodeIds.map(nodeId => ({
    nodeId: nodeId,
    attributeId: AttributeIds.Value
  }));

  return subscribeVariableInternal("monitorVariables", session, itemsToMonitor, args.parameters);
}

//
// Event subscription
//

function subscribeEventInternal(name, session, itemsToMonitor, parameters, ast) {
  parameters = parameters || {};
  const eventFields = getFieldNames(ast).filter(field => field != "nodeId");

  const subscriptionParameters = {
    requestedPublishingInterval: parameters.publishingInterval == null ? 1000 : parameters.publishingInterval,
    requestedLifetimeCount: 60,
    requestedMaxKeepAliveCount: 10,
    maxNotificationsPerPublish: 0,
    publishingEnabled: true,
    priority: parameters.priority || 0
  };

  const monitorParameters = {
    samplingInterval: -1, // the same as publishingInterval
    queueSize: parameters.queueSize || 0,
    discardOldest: parameters.discardOldest == null ? true : parameters.discardOldest,
    filter: constructEventFilter(eventFields.map(utils.upperFirstLetter)),
  };

  return new NotificationDataIterator(session, itemsToMonitor, subscriptionParameters,
    monitorParameters, (monitoredItem, dataValue, index) => {
      const data = { nodeId: monitoredItem.itemToMonitor.nodeId };
      dataValue.forEach((value, index) => data[eventFields[index]] = value);
      return {[name]: data};
    }
  );
}

function subscribeEventSource(parent, args, context, ast) {
  const { session } = context.opcua;

  const itemsToMonitor = [{
    nodeId: args.nodeId,
    attributeId: AttributeIds.EventNotifier
  }];

  return subscribeEventInternal("monitorEventSource", session, itemsToMonitor, args.parameters, ast);
}

function subscribeEventSources(parent, args, context, ast) {
  const { session } = context.opcua;

  const itemsToMonitor = args.nodeIds.map(nodeId => ({
    nodeId: nodeId,
    attributeId: AttributeIds.EventNotifier
  }));

  return subscribeEventInternal("monitorEventSources", session, itemsToMonitor, args.parameters, ast);
}

function resolveVariantToValue(parent, args, context, ast) {
  const data = parent[ast.fieldName];
  return data != null ? data.value : null;
}


const resolvers = {
  Subscription: {
    monitorVariable: { subscribe: subscribeVariable },
    monitorVariables: { subscribe: subscribeVariables },
    monitorEventSource: { subscribe: subscribeEventSource },
    monitorEventSources: { subscribe: subscribeEventSources },
  },

  Event: {
    eventType:  resolveVariantToValue,
    sourceNode: resolveVariantToValue,
    sourceName: resolveVariantToValue,
    message:    resolveVariantToValue,
    severity:   resolveVariantToValue,
  },
};

module.exports.resolvers = resolvers;
