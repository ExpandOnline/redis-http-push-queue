'use strict';
import mkdebug from 'debug';
import config from 'config';
import {any, equals, curry, assoc} from 'ramda';
import {doRequest} from './request.js';
import prettyjson from 'prettyjson';

const debug = mkdebug('redis-http-push-queue:log');
const error = mkdebug('redis-http-push-queue:error');

const queue = {};

const add = msg => {
  queue[msg.channel] = queue[msg.channel] || [];
  queue[msg.channel].push({msg, retries: 0});
};

const runRequest = ({msg, retries}, callback) => {
  debug(`Handling ${msg.channel} message`);
  debug(`URI: ${msg.endpoint}`);
  debug(`Contents: ${prettyjson.render(msg.args)}`);
  try {
    const response = doRequest(assoc('headers', config.get(`redis.queue.${msg.channel}.headers`), msg));
    response.on('response', function(res) {
      if (any(equals(res.statusCode), config.get(`redis.queue.${msg.channel}.retryCodes`))) {
        if (retries < (config.get(`redis.queue.${msg.channel}.maxRetries`))) {
          queue[msg.channel].unshift({msg, retries: retries + 1});
          callback(config.get(`redis.queue.${msg.channel}.errorWait`));
        } else {
          error(`Dropped msg for ever and ever.. Contents: ${JSON.stringify(msg)}`);
          callback(0);
        }
      } else {
        callback(0);
      }
    });
  } catch (err) {
    debug(`Message ${msg.channel} failed with error: ${err}`);
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
