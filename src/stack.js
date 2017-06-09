'use strict';
import mkdebug from 'debug';
import config from 'config';
import {any, equals, curry, assoc, map} from 'ramda';
import {doRequest} from './request.js';

const debug = mkdebug('redis-http-push-queue:log');
const error = mkdebug('redis-http-push-queue:error');

const queue = {};

const add = msg => {
  queue[msg.channel] = queue[msg.channel] || [];
  queue[msg.channel].push({msg, retries: 0});
};

const runRequest = ({msg, retries}, callback) => {
  const requestId = require('crypto').randomBytes(6).toString('hex');

  debug(JSON.stringify({
    requestId,
    message: '[INFO] Handling action',
    uri: msg.endpoint,
    body: msg.args,
    channel: msg.channel
  }));
  try {
    const response = doRequest(requestId, msg.channel, assoc('headers', config.get(`redis.queue.${msg.channel}.headers`), msg));
    response.on('response', function(res) {
      if (any(equals(res.statusCode), config.get(`redis.queue.${msg.channel}.retryCodes`))) {
        if (retries < (config.get(`redis.queue.${msg.channel}.maxRetries`))) {
          queue[msg.channel].unshift({msg, retries: retries + 1});
          callback(config.get(`redis.queue.${msg.channel}.errorWait`));
        } else {
          error(JSON.stringify({
            requestId,
            message: 'Dropped msg for ever and ever',
            body: msg
          }));
          callback(0);
        }
      } else {
        callback(0);
      }
    });
  } catch (err) {
    debug(JSON.stringify({
      requestId,
      message: '[ERROR] Action failed',
      channel: msg.channel,
      error: err
    }));
    callback(0);
  }
};

const run = curry((channel, wait) => {
  queue[channel] = queue[channel] || [];
  const channelRun = run(channel);

  setTimeout(() => {
    if (queue[channel].length === 0) {
      channelRun(1000);
      return;
    }
    const current = queue[channel].shift();
    runRequest(current, channelRun);
  }, wait);
});

export {add as add};
export {run as run};
