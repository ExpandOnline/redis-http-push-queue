'use strict';
import request from 'request';
import mkdebug from 'debug';
import config from 'config';
import redis from 'redis';

const debug = mkdebug('redis-http-push-queue:log');
const error = mkdebug('redis-http-push-queue:error');

const connect = (host, port) => redis.createClient(`redis://${host}:${port}`);

export default () => {
  debug('Opening redis connection');
  const client = connect(config.get('redis.host'), config.get('redis.port'));
  client.on('message', (channel, message) => {
    message = JSON.parse(message);
    request.post({
      json: true,
      url: message.endpoint,
      body: message.args,
      headers: config.get('headers')
    }, (err, res, body) => {
      if (err) {
        error(err);
        return;
      }
      const resMsg = `Got back statuscode ${res.statusCode} with body ${JSON.stringify(body)}`;
      if (res.statusCode >= 200 && res.statusCode <= 299) {
        debug(resMsg);
      } else {
        error(resMsg);
      }
    });
  });
  debug(`Subscribing to ${config.get('redis.queue')}`);
  client.subscribe(config.get('redis.queue'));
};
