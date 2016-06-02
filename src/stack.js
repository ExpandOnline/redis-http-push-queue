'use strict';
import request from 'request';
import mkdebug from 'debug';
import config from 'config';
import {any, equals} from 'ramda';

const debug = mkdebug('redis-http-push-queue:log');
const error = mkdebug('redis-http-push-queue:error');

const queue = [];

const add = msg => {
  queue.push({msg, retries: 0});
};

const runRequest = ({msg, retries}, callback) => request.post({
  json: true,
  url: msg.endpoint,
  body: msg.args,
  headers: config.get('headers')
}, (err, res, body) => {
  if (err) {
    error(err);
    return;
  }
  const resMsg =
   `Got back statuscode ${res.statusCode} with body ${JSON.stringify(body)}`;

  if (res.statusCode >= 200 && res.statusCode <= 299) {
    debug(resMsg);
  } else {
    error(resMsg);
  }

  if (any(equals(res.statusCode), config.get('redis.retryCodes'))) {
    if (retries < config.get('redis.maxRetries')) {
      queue.unshift({msg, retries: retries + 1});
      callback(config.get('redis.errorWait'));
    } else {
      error(`Dropped msg for ever and ever.. Contents: ${JSON.stringify(msg)}`);
      callback(0);
    }
  } else {
    callback(0);
  }
});

const run = wait => {
  setTimeout(() => {
    if (queue.length === 0) {
      run(1000);
      return;
    }

    const current = queue.shift();
    runRequest(current, run);
  }, wait);
};

export {add as add};
export {run as run};
