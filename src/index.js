'use strict';
import mkdebug from 'debug';
import config from 'config';
import redis from 'redis';
import {run, add} from './stack';
import {assoc} from 'ramda';

const debug = mkdebug('redis-http-push-queue:log');

const connect = (host, port) => redis.createClient(`redis://${host}:${port}`);

export default () => {
  debug('Opening redis connection');
  const client = connect(config.get('redis.host'), config.get('redis.port'));

  client.on('message', (channel, message) => {
    add(assoc('channel', channel, JSON.parse(message)));
  });

  config.get('redis.queue').forEach(function(queue) {
    run(queue.channel, 0);
    debug(`Subscribing to ${queue.channel}`);
    client.subscribe(queue.channel);
  });
};
