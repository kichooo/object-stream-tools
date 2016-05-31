'use strict'

const fs = require('fs')
const tap = require('tap')
const ost = require('../index')
const jsonStream = require('JSONStream')
const stream = require('stream')

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

tap.test('Test map uses correct iterator', t =>
    dataStream()
        .pipe(ost.map((obj, i) => obj.foo + i))
        .pipe(ost.streamToArray())
        .on('data', objs => t.same(objs, ['bar0', 'foo1', 'rand2']))
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

tap.test('Test filter uses correct iterator', t =>
    dataStream()
        .pipe(ost.filter((e, i) => e.value + i > 6))
        .pipe(ost.streamToArray())
        .on('data', objs =>
            t.same(objs, data.filter((e, i) => e.value + i > 6)))
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

tap.test('Test reduce with no initial value', t =>
    dataStream()
        .pipe(ost.map(obj => obj.value))
        .pipe(ost.reduce((acc, curr, i) => {
            return acc + curr + i
        }))
        .on('data', reducedValue =>
            t.same(reducedValue, 42 + 1 + 7 + 1))
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

tap.test('Test thru not losing this (so it can use this.push)', t =>
    dataStream()
        .pipe(ost.thru(function (obj, cb) {
            this.push(obj.cats.length)
            this.push(obj.cats.length * 2)
            cb()
        }))
        .pipe(ost.streamToArray())
        .on('data', objs => t.same(objs, [3, 6, 3, 6, 2, 4]))
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test thruParallel not losing this (so it can use this.push)', t =>
    dataStream()
        .pipe(ost.thruParallel(2, function (obj, cb) {
            this.push(obj.cats.length)
            this.push(obj.cats.length * 2)
            cb()
        }))
        .pipe(ost.streamToArray())
        .on('data', objs => t.same(objs.sort(), [3, 6, 3, 6, 2, 4].sort()))
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test promise to stream on successful resolution', t =>
    ost.promiseToStream(new Promise((resolve, reject) => {
        setTimeout(() => resolve([3, 6, 3, 6, 2, 4]), 10)
    }))
        .on('data', objs => t.same(objs, [3, 6, 3, 6, 2, 4]))
        .on('error', t.fail)
        .on('end', t.end)
)

tap.test('Test promise to stream on rejection', t =>
    ost.promiseToStream(new Promise((resolve, reject) => {
        setTimeout(() => reject([3, 6, 3, 6, 2, 4]), 10)
    }))
        .on('data', data => t.fail('this one should be rejected'))
        .on('error', err => {
            t.pass('this promise is rejected')
            t.end()
        })
)

tap.test('Test stream to promise', t =>
    ost.streamToPromise(dataStream())
        .then(objs => t.same(objs, data))
        .catch(t.fail)
)

tap.test('Test stream to promise on broken streams', t => {
    const readable = ost.newReadable()

    ost.streamToPromise(readable)
        .then(data => t.fail('should resolve as failed promise'))
        .catch(err => {
            t.same(err, 'Jabberwacky')
            t.end()
        })

    readable.emit('error', 'Jabberwacky')
})

tap.test('Test some if any value matches', t =>
    ost.streamToPromise(
        dataStream().pipe(ost.some(el => el.value === 42))
    )
        .then(boolArr => t.same(...boolArr, true))
        .catch(t.fail)
)

tap.test('Test some when no value matches', t =>
    ost.streamToPromise(
        dataStream().pipe(ost.some(el => el.value === 'XXL'))
    )
        .then(boolArr => t.same(...boolArr, false))
        .catch(t.fail)
)

tap.test('Test find if value exits in the stream', t =>
    ost.streamToPromise(
        dataStream().pipe(ost.find(el => el.value === 42))
    )
        .then(objs => t.same(...objs, data.find(el => el.value === 42)))
        .catch(t.fail)
)

tap.test('Test find if value does not exist in the stream', t =>
    ost.streamToPromise(
        dataStream().pipe(ost.find(el => el.value === 'XXL'))
    )
        .then(objs => t.same(...objs, data.find(el => el.value === 'XXL')))
        .catch(t.fail)
)

function dataStream() {
    return fs.createReadStream('./test/data.json')
        .pipe(jsonStream.parse('*'))
}

function testFilter(obj) {
    return obj.szop === 'pracz'
}
