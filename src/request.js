'use strict';
import request from 'request';
import mkdebug from 'debug';
import prettyjson from 'prettyjson';

const debug = mkdebug('redis-http-push-queue:log');
const error = mkdebug('redis-http-push-queue:error');

export const doRequest = msg => request.post({
  json: true,
  url: msg.endpoint,
  body: msg.args,
  headers: msg.headers
}, (err, res, body) => {
  if (err) {
    error(err);
    return;
  }
  const resMsg =
   `Got back statuscode ${res.statusCode} with body ${prettyjson.render(body)}`;

  if (res.statusCode >= 200 && res.statusCode <= 299) {
    debug(resMsg);
  } else {
    error(resMsg);
  }
});
