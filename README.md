# object-stream-tools

# Installation

```js
npm install --save object-stream-tools
```

# Usage


#### arrayToStream

```js
const ost = require('object-stream-tools')
ost.arrayToStream([{foo: 'bar'}, {web: 'scale'}])
        .on('data', data => {
            console.log(data)
        })
        .pipe(somewhereWritable)        
```

Prints

```js
[{foo: 'bar'}, {web: 'scale'}]
```


#### streamToSet

Its very useful if you want to get unique elements / set of values

```js
    const jsonStream = require('JSONStream')
    ost.streamToSet(fs.createReadStream('./test/data.json')
        .pipe(jsonStream.parse('*'))
        .pipe(ost.map(obj => obj.requiredProperty)))
        .then(uniqueSet => {
            // here one get array of unique elements
            const uniqueArray = Array.from(uniqueSet.values()).sort()
        })
```

#### map-reduce

Map is useful when you want to modify existing objects in the stream.

Reduce is useful if you want to get single object/value based on whole stream, but
you dont want to load whole stream to memory.

Example: sum / average value of huge stream

```js
    const jsonStream = require('JSONStream')
    ost.streamToArray((fs.createReadStream('./test/data.json')
        .pipe(jsonStream.parse('*'))
        .pipe(ost.map(obj => obj.requiredProperty))
        .pipe(ost.reduce((acc, curr, i, arr) => {
            return acc + curr + i
        }, 0)))
        .then(reducedValue) => {
            // here you will get reduced value wraped in array
        })
```

## Please look at the tests for more use cases.
