 const stream = require('stream');
 const through2Concurrent = require('through2-concurrent');
 const streamToArray = require('stream-to-array');

 'use strict';

 const thru = (transform, flush) => new stream.Transform({
     objectMode: true,
     transform,
     flush
 });

 const thruParallel = (transform, maxConcurrency) =>
     thruConcurrent.obj({ maxConcurrency }, transform);

 const devNull = require('fs').createWriteStream('/dev/null');

 const arrayToStream = (data) => {
     const newStream = new stream.Readable({ objectMode: true });
     data.forEach(item => newStream.push(item));
     newStream.push(null);
     return newStream
 };

 const streamToSet = (stream) => {
     return new Promise((resolve, reject) => {
         const set = new Set();
         stream
             .on('data', data => set.add(data))
             .on('error', reject)
             .on('end', () => resolve(set))
     })
 }

 const newReadable = () => {
     const rs = new stream.Readable({ objectMode: true });
     rs._read = () => {};
     return rs
 }

 function map(func) {
     return new stream.Transform({
         objectMode: true,
         transform: (data, enc, cb) => {
             cb(null, func(data))
         }
     })
 }

 function filter(func) {
     return new stream.Transform({
         objectMode: true,
         transform: (data, enc, cb) => {
             if (func(data)) {
                 cb(null, data)
             } else {
                 cb();
             }
         }
     })
 }


 };

 module.exports = {
     thru,
     Stream,
     devNull,
     thruConcurrent,
     thruParallel,
     arrayToStream,
     streamToArray,
     streamToSet,
     newReadable,
     map,
     filter
 }
