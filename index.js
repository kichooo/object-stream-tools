'use strict'

const stream = require('stream')
const through2Concurrent = require('through2-concurrent')
const streamToArray = require('stream-to-array')

function thru(transform, flush) {
    return new stream.Transform({
        objectMode: true,
        transform: (obj, enc, cb) => transform(obj, cb),
        flush
    })
}

function thruParallel(maxConcurrency, transform, flush) {
    return through2Concurrent.obj({maxConcurrency},
        (obj, enc, cb) => transform(obj, cb), flush
    )
}

function arrayToStream(data) {
    const newStream = new stream.Readable({objectMode: true})
    data.forEach(item => newStream.push(item))
    newStream.push(null)
    return newStream
}

function streamToSet(stream) {
    return new Promise((resolve, reject) => {
        const set = new Set()
        stream
            .on('data', data => set.add(data))
            .on('error', reject)
            .on('end', () => resolve(set))
    })
}

function newReadable() {
    const rs = new stream.Readable({objectMode: true})
    rs._read = () => {
    }
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
                cb()
            }
        }
    })
}

function reduce(func, acc) {
    let i = 0
    return thru((curr, cb) => {
        acc = func(acc, curr, i++)
        cb()
    }, function() {
        this.emit('data', acc)
        this.emit('end')
    })
}

module.exports = {
    thru,
    thruParallel,
    arrayToStream,
    streamToArray,
    streamToSet,
    newReadable,
    map,
    filter,
    reduce
}
