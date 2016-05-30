'use strict'

const fs = require('fs')
const tap = require('tap')
const ost = require('../index.js')
const jsonStream = require('JSONStream')
const _ = require('lodash')

const data = require('./data.json')

tap.test('Test thru', t =>
    dataStream()
        .pipe(ost.thru((obj, cb) => cb(null, obj.cats.length)))
        .pipe(ost.streamToArray())
        .on('data', objs => t.same(objs, [3, 3, 2]))
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test streamToArray', t =>
    dataStream()
        .pipe(ost.streamToArray())
        .on('data', objs => t.same(objs, data))
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test streamToSet returns unique values', t =>
    dataStream()
        .pipe(ost.map(obj => obj.szop))
        .pipe(ost.streamToSet())
        .on('data', uniqueSet =>
            t.same(Array.from(uniqueSet.values()), ['pracz', 'niepracz'])
        )
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test arrayToStream', t =>
    ost.arrayToStream(data)
        .pipe(ost.map(obj => obj.szop))
        .pipe(ost.streamToArray())
        .on('data', objs => {
            t.same(objs, ['pracz', 'pracz', 'niepracz'])
        })
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test map', t =>
    dataStream()
        .pipe(ost.map(obj => obj.foo))
        .pipe(ost.streamToArray())
        .on('data', objs => t.same(objs, ['bar', 'foo', 'rand']))
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test filter', t =>
    dataStream()
        .pipe(ost.filter(testFilter))
        .pipe(ost.streamToArray())
        .on('data', objs => t.same(objs, data.filter(testFilter)))
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test filter on numerical values', t =>
    dataStream()
        .pipe(ost.filter(e => e.value > 6))
        .pipe(ost.streamToArray())
        .on('data', objs => t.same(objs, data.filter(e => e.value > 6)))
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test reduce', t =>
    dataStream()
        .pipe(ost.map(obj => obj.value))
        .pipe(ost.reduce((acc, curr, i) => {
            return acc + curr + i
        }, 0))
        .on('data', reducedValue =>
            t.same(reducedValue, 42 + 1 + 7 + 3))
        .on('error', err => t.fail(err.stack))
        .pipe(jsonStream.stringify())
        .on('end', t.end)
)

// This test is a bit more complicated. We will only let the 1st object through when second has already been called.
tap.test('Test thruParallel', t => {
    let secondObjDone = false
    dataStream()
        .pipe(ost.thruParallel(2, (obj, cb) => {
            if (obj.foo === 'bar') {
                const interval = setInterval(() => {
                    if (secondObjDone) {
                        cb(null, obj.cats.length)
                        clearInterval(interval)
                    }
                }, 100)
                return
            }
            if (obj.foo === 'foo') {
                secondObjDone = true
            }
            cb(null, obj.cats.length)
        }))
        .pipe(ost.streamToArray())
        .on('data', objs => {
            const actualData = objs.sort()
            const expectedData = data.map(obj => obj.cats.length).sort()
            t.same(actualData, expectedData)
        })
        .on('error', t.fail)
        .on('end', t.end)
})

function dataStream() {
    return fs.createReadStream('./test/data.json')
        .pipe(jsonStream.parse('*'))
}

function testFilter(obj) {
    return obj.szop === 'pracz'
}
