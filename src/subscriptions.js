"use strict";
const gql = require("graphql-tag");
const { AttributeIds } = require("node-opcua-data-model");
const { StatusCodes } = require("node-opcua-status-code");
const { constructEventFilter } = require("node-opcua-service-filter");
const { NotificationDataIterator } = require('./notification-data-iterator');

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

  return new NotificationDataIterator(name, session, itemsToMonitor,
    subscriptionParameters, monitorParameters);
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

function subscribeEventInternal(name, session, itemsToMonitor, parameters, ast) {
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
    discardOldest: parameters.discardOldest == null ? true : parameters.discardOldest,
    filter: constructEventFilter(["EventType", "SourceNode", "SourceName", "Message", "Severity"]),
  };

  return new NotificationDataIterator(name, session, itemsToMonitor,
    subscriptionParameters, monitorParameters);
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

function resolveDataValueToVariant(parent, args, context, ast) {
  const data = parent.dataValue;
  return data.statusCode.equals(StatusCodes.Good) ? data.value : null;
}


const resolvers = {
  Subscription: {
    monitorVariable: { subscribe: subscribeVariable },
    monitorVariables: { subscribe: subscribeVariables },
    monitorEventSource: { subscribe: subscribeEventSource },
    monitorEventSources: { subscribe: subscribeEventSources },
  },

  ValueUpdate: {
    value: resolveDataValueToVariant,
  },

  Event: {
    eventType: parent => parent.dataValue[0].value,
    sourceNode: parent => parent.dataValue[1].value,
    sourceName: parent => parent.dataValue[2].value,
    message: parent => parent.dataValue[3].value,
    severity: parent => parent.dataValue[4].value,
  },
};

module.exports.resolvers = resolvers;
