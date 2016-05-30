'use strict'

const stream = require('stream')
const through2Concurrent = require('through2-concurrent')

function thru(transform, flush) {
    return new stream.Transform({
        objectMode: true,
        transform: function(obj, enc, cb) { transform.call(this, obj, cb) },
        flush
    })
}

function thruParallel(maxConcurrency, transform, flush) {
    return through2Concurrent.obj({ maxConcurrency },
        function(obj, enc, cb) {
            transform.call(this, obj, cb)
        },
        flush
    )
}

function arrayToStream(data) {
    const newStream = new stream.Readable({ objectMode: true })
    data.forEach(item => newStream.push(item))
    newStream.push(null)
    return newStream
}

function streamToSet() {
    return reduce((acc, curr) => {
        acc.add(curr)
        return acc
    }, new Set())
}

function streamToArray() {
    return reduce((acc, curr) => {
        acc.push(curr)
        return acc
    }, [])
}

function newReadable() {
    const rs = new stream.Readable({ objectMode: true })
    rs._read = () => {}
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

function required() {
    throw new Error('Initial value required')
}

function reduce(func, acc = required()) {
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
    streamToSet,
    streamToArray,
    newReadable,
    map,
    filter,
    reduce
}
