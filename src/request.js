'use strict';
import request from 'request';
import mkdebug from 'debug';
import fs from 'fs';

const debug = mkdebug('redis-http-push-queue:log');
const error = mkdebug('redis-http-push-queue:error');

export const doRequest = msg => request.post({
  json: true,
  url: msg.endpoint,
  body: msg.args,
  headers: msg.headers,
  key: fs.readFileSync('ssl.key'),
  cert: fs.readFileSync('ssl.crt')
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
});
