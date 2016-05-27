'use strict'

const fs = require('fs')
const tap = require('tap')
const ost = require('../index.js')
const jsonStream = require('JSONStream')

const data = require('./data.json')

tap.test('Test thru', t =>
    ost.streamToArray(dataStream()
        .pipe(ost.thru((obj, cb) => cb(null, obj.cats.length))))
        .then(objs => t.same(objs, [3, 3, 2]), t.fail)
)

tap.test('Test streamToArray', t =>
    ost.streamToArray(dataStream())
        .then(objs => t.same(objs, data), t.fail)
)

tap.test('Test streamToSet', t =>
    ost.streamToSet(dataStream()
        .pipe(ost.map(obj => obj.szop)))
        .then(uniqueSet => {
            const actual = Array.from(uniqueSet.values()).sort()
            const expectedData = ["pracz", "niepracz"].sort()
            t.same(actual, expectedData)
        }, t.fail)
)

tap.test('Test arrayToStream', t =>
    ost.streamToArray(
        ost.arrayToStream(data)
            .pipe(ost.map(obj => obj.szop)))
        .then(objs => {
            t.same(objs, ["pracz", "pracz", "niepracz"])
        }, t.fail)
)

tap.test('Test map', t =>
    ost.streamToArray(dataStream()
        .pipe(ost.map(obj => obj.foo)))
        .then(objs => t.same(objs, ["bar", "foo", "rand"]), t.fail)
)


tap.test('Test filter', t =>
    ost.streamToArray(dataStream()
        .pipe(ost.filter(testFilter)))
        .then(objs => t.same(objs, data.filter(testFilter)), t.fail)
)

tap.test('Test reduce', t =>
    ost.streamToArray(dataStream()
        .pipe(ost.map(obj => obj.value))
        .pipe(ost.reduce((acc, curr, i, arr) => {
            return acc + curr + i
        }, 0))
        .on('error', err => t.fail(err.stack)))
        .then(reducedValue => {
            // array because streamToArray
            t.same(reducedValue, [42 + 1 + 7 + 3])
        }, t.fail)
)

// This test is a bit more complicated. We will only let the 1st object through when second has already been called.
tap.test('Test thruParallel', t => {
    let secondObjDone = false
    return ost.streamToArray(dataStream()
        .pipe(ost.thruParallel(2, (obj, cb) => {
            if (obj.foo === "bar") {
                const interval = setInterval(() => {
                    if (secondObjDone) {
                        cb(null, obj.cats.length)
                        clearInterval(interval)
                    }
                }, 100)
                return
            }
            if (obj.foo === "foo") {
                secondObjDone = true
            }
            cb(null, obj.cats.length)
        })))
        .then(objs => {
            const actualData = objs.sort()
            const expectedData = data.map(obj => obj.cats.length).sort()
            t.same(actualData, expectedData)
        }, t.fail)
})

function dataStream() {
    return fs.createReadStream('./test/data.json')
        .pipe(jsonStream.parse('*'))
}

function testFilter(obj) {
    return obj.szop === "pracz"
}
