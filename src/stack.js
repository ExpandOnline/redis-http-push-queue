'use strict';
import mkdebug from 'debug';
import config from 'config';
import {any, equals, curry, assoc} from 'ramda';
import {doRequest} from './request.js';
import prettyjson from 'prettyjson';

const debug = mkdebug('redis-http-push-queue:log');
const error = mkdebug('redis-http-push-queue:error');

const MAX_RETRIES = config.get('redis.maxRetries');
const WAIT_ON_ERROR = config.get('redis.errorWait');

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
    const response = doRequest(assoc('headers', config.get('headers'), msg));
    response.on('response', function() {
      if (any(equals(response.statusCode), config.get('redis.retryCodes'))) {
        if (retries < MAX_RETRIES) {
          queue[msg.channel].unshift({msg, retries: retries + 1});
          callback(WAIT_ON_ERROR);
        } else {
          error(`Dropped msg for ever and ever.. Contents: ${JSON.stringify(msg)}`);
          callback(0);
        }
      } else {
        callback(0);
      }
    });
  } catch(err) {
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
