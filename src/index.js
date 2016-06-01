'use strict';
import mkdebug from 'debug';
import config from 'config';
import redis from 'redis';
import {run, add} from './stack';

const debug = mkdebug('redis-http-push-queue:log');

const connect = (host, port) => redis.createClient(`redis://${host}:${port}`);

export default () => {
  debug('Opening redis connection');
  const client = connect(config.get('redis.host'), config.get('redis.port'));
  run(0);
  client.on('message', (channel, message) => {
    add(JSON.parse(message));
  });
  debug(`Subscribing to ${config.get('redis.queue')}`);
  client.subscribe(config.get('redis.queue'));
};
