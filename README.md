# object-stream-tools

# Installation

```js
npm install --save object-stream-tools
```

# Usage

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


Please look at the tests for more use cases.
