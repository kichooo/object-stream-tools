'use strict'

const stream = require('stream')
const through2Concurrent = require('through2-concurrent')

function thru(transform, flush) {
    return new stream.Transform({
        objectMode: true,
        transform: function(obj, enc, cb) {
            transform.call(this, obj, cb)
        },
        flush
    })
}

const thruParallel = (maxConcurrency, transform, flush) =>
    through2Concurrent.obj({ maxConcurrency },
        function(obj, enc, cb) {
            transform.call(this, obj, cb)
        },
        flush
    )

function map(func) {
    let i = 0
    return thru((data, cb) => {
        cb(null, func(data, i++))
    })
}

function filter(func) {
    let i = 0
    return thru((data, cb) => {
        if (func(data, i++)) {
            cb(null, data)
        } else {
            cb()
        }
    })
}

function some(func) {
    return reduce(function(acc, curr, i) {
        if (func(curr, i)) {
            this.end()
            return true
        }
        return false
    }, false)
}

function find(func) {
    return reduce(function(acc, curr, i) {
        if (func(curr, i)) {
            this.end()
            return curr
        }
    }, null)
}

function reduce(func, acc) {
    let i = 0
    const thruReduce = thru(function(curr, cb) {
        if (acc === undefined) {
            acc = curr
            return cb()
        }
        acc = func.call(this, acc, curr, i++)
        cb()
    }, function() {
        this.emit('data', acc)
        this.emit('end')
    })
    thruReduce.promise = () => new Promise((resolve, reject) => {
        thruReduce
            .on('data', resolve)
            .on('error', reject)
    })

    return thruReduce
}

function newReadable() {
    const rs = new stream.Readable({ objectMode: true })
    rs._read = () => {}
    return rs
}

function arrayToStream(data) {
    const newStream = newReadable()
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

function promiseToStream(promise) {
    const newStream = newReadable()
    promise
        .then(data => {
            newStream.push(data)
            newStream.push(null)
        })
        .catch(err => newStream.emit('error', err))
    return newStream
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
    reduce,
    some,
    find,
    promiseToStream
}
