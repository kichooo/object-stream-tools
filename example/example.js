const jsonStream = require('JSONStream')
const fs = require('fs')
const ost = require('../index')

ost.streamToPromise(fs.createReadStream('../test/data.json')
    .pipe(jsonStream.parse('*'))
    .pipe(ost.find(e => e.value > 6)))
    .then(foundObj => {
        // here you will get found first object that matches condition
        // or undefined when there were none that matches
    })
