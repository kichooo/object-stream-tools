'use strict'

const stream = require('stream')
const through2Concurrent = require('through2-concurrent')

function thru(transform, flush) {
    return new stream.Transform({
        objectMode: true,
        transform: function (obj, enc, cb) {
            transform.call(this, obj, cb)
        },
        flush
    })
}

function thruParallel(maxConcurrency, transform, flush) {
    return through2Concurrent.obj({maxConcurrency},
        function (obj, enc, cb) {
            transform.call(this, obj, cb)
        },
        flush
    )
}

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
    let i = 0
    return thru(function (curr, cb) {
        if (func(curr, i++)) {
            cb(null, true)
            this.emit('end')
        } else {
            cb()
        }
    }, function () {
        this.emit('data', false)
        this.emit('end')
    })
}

function find(func) {
    let i = 0
    return thru(function (curr, cb) {
        if (func(curr, i++)) {
            cb(null, curr)
            this.emit('end')
        } else {
            cb()
        }
    }, function () {
        this.emit('data', undefined)
        this.emit('end')
    })
}

function reduce(func, acc) {
    let i = 0
    return thru((curr, cb) => {
        if (acc === undefined) {
            acc = curr
            return cb()
        }
        acc = func(acc, curr, i++)
        cb()
    }, function () {
        this.emit('data', acc)
        this.emit('end')
    })
}

function newReadable() {
    const rs = new stream.Readable({objectMode: true})
    rs._read = () => {
    }
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

function streamToPromise(stream) {
    return new Promise((resolve, reject) => {
        const arr = []
        stream
            .on('data', data => arr.push(data))
            .on('error', reject)
            .on('end', () => resolve(arr))
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
    reduce,
    some,
    find,
    promiseToStream,
    streamToPromise
}
