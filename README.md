# read-files
A collection of ES6 Modules that take in `ArrayBuffer`s of a file and return an Object that can be used.

## Basic Usage
```js
import { ZipFile } from `./types/zip.js`;

async function() {
    fetch(`https://example.com/file.zip`)
    .then(x => x.arrayBuffer)
    .then(x => new ZipFile(x))
    .then((x) => {
        // use `x` which is a `Map` with the files as entries.
        // use `.data()` to get the data of a file
    })
}
```

## License
MIT

## Contact
Web: https://me.nektro.net  
Twitter: https://twitter.com/Nektro  
GitHub: https://github.com/Nektro
