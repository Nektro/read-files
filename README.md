# read-files
A collection of new File constructors that take in `ArrayBuffer`s of a file and return an Object that can be used to read the data inside complex file types.

[![NPM](https://nodei.co/npm/file-parsers.png?downloads=true)](https://nodei.co/npm/file-parsers/)

## Basic Usage
Include a file from https://unpkg.com/file-parsers@1.0.0/

```js
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
