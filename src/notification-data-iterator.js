"use strict";
const { $$asyncIterator } = require('iterall');
const { ClientSubscription } = require("node-opcua-client");

class NotificationDataIterator {
  constructor(session, itemsToMonitor, subscriptionParameters, monitorParameters, dataHandler) {
    this._session = session;
    this._itemsToMonitor = itemsToMonitor;
    this._subscriptionParameters = subscriptionParameters;
    this._monitorParameters = monitorParameters;
    this._dataHandler = dataHandler;

    this._active = true;
    this._pullQueue = [];
    this._pushQueue = []; // TODO: limit queue size

    this._subscription = null;
  }

  _subscribe() {
    this._subscription = new ClientSubscription(this._session, this._subscriptionParameters);

    return new Promise((resolve, reject) => {
      this._subscription.monitorItems(this._itemsToMonitor, this._monitorParameters, null,
        (err, monitor) => err ? reject(err) : resolve(monitor)
      );
    }).then(monitor => {
      monitor.on("changed", (monitoredItem, dataValue, index) => {
        this._pushValue(this._dataHandler(monitoredItem, dataValue, index));
      });
    }).catch(err => {
      this._unsubscribe();
      throw err;
    });
  }

  _unsubscribe() {
    if (this._subscription) {
      const subscription = this._subscription;
      this._subscription = null;

      return new Promise((resolve, reject) => {
        subscription.terminate(err => err ? reject(err) : resolve());
      });
    }

    return Promise.resolve();
  }

  _pushValue(data) {
    if (!this._active) {
      return;
    }

    if (this._pullQueue.length !== 0) {
      this._pullQueue.shift()({ value: data, done: false });
    } else {
      this._pushQueue.push(data);
    }
  }

  _pullValue() {
    return new Promise(resolve => {
      if (this._pushQueue.length !== 0) {
        resolve({ value: this._pushQueue.shift(), done: false });
      } else {
        this._pullQueue.push(resolve);
      }
    });
  }

  _emptyQueue() {
    if (this._active) {
      this._active = false;
      this._pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
      this._pullQueue.length = 0;
      this._pushQueue.length = 0;

      return this._unsubscribe();
    }

    return Promise.resolve();
  }

  next() {
    if (!this._active) {
      return this.return();
    }

    if (!this._subscription) {
      return this._subscribe().then(() => this._pullValue());
    }

    return this._pullValue();
  }

  return() {
    return this._emptyQueue().then(() => ({ value: undefined, done: true }));
  }

  throw(error) {
    return this._emptyQueue().then(() => Promise.reject(error));
  }

  [$$asyncIterator]() {
    return this;
  }
}

exports.NotificationDataIterator = NotificationDataIterator;
