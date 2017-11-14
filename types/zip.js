/**
 * Copyright (c) 2017 Nektro
 */
// parse a .zip file as a JS Object
// ZIP Archive
// in accordance with https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
//
(function() {
    function ta_str(ta) {
        return String.fromCharCode.apply(null, ta);
    }
    //
    function ta_le4(ui8a, le) {
        return new DataView(ui8a.buffer).getUint32(0, le || true);
    }
    //
    function ta_le2(ui8a, le) {
        return new DataView(ui8a.buffer).getUint16(0, le || true);
    }
    //
    const local_file_header_signature = ta_le4(Uint8Array.from([0x04,0x03,0x4b,0x50].reverse()));
    const central_file_header_signature = ta_le4(Uint8Array.from([0x02,0x01,0x4b,0x50].reverse()));
    const end_of_central_directory_signature = ta_le4(Uint8Array.from([0x06,0x05,0x4b,0x50].reverse()));
    //
    class ZipFileEntry {
        constructor(obj) {
            this.version = obj.ver;
            this.flag = obj.gen;
            this.compression = obj.com;
            this.lastModified = new Date();
            this.crc32 = obj.crc;
            this.sizeCompressed = obj.cms;
            this.sizeReal = obj.ucs;
            this.name = obj.fnv;
            this.extra = obj.efv;
            this.raw = obj.data;
        }
        data() {
            switch (this.compression) {
                case 0: // The file is stored (no compression)
                    return Promise.resolve(ta_str(this.raw));
                default:
                    console.warn('Unknown compression method, sending raw data!');
                    return new Promise((resolve, reject) => {
                        resolve(this.raw);
                    });
            }
        }
    }
    //
    class ZipFile extends Map {
        constructor(ab) {
            super();
            let pos = 0;

            function get_file_entry(ui8a) {
                try {
                    let sig = ta_le4(ui8a.slice(pos, pos += 4)); // local_file_header_signature
                    if (sig !== local_file_header_signature) {
                        pos -= 4;
                        throw new Error(`ZipFileEntry: local_file_header_signature did not match`);
                    }
                    let ver = ta_le2(ui8a.slice(pos, pos += 2)); // version
                    let gen = ta_le2(ui8a.slice(pos, pos += 2)); // general purpose
                    let com = ta_le2(ui8a.slice(pos, pos += 2)); // compression method
                    let lmt = ta_le2(ui8a.slice(pos, pos += 2)); // last modified time
                    let lmd = ta_le2(ui8a.slice(pos, pos += 2)); // last modified date
                    let crc = ta_le4(ui8a.slice(pos, pos += 4)); // crc 32
                    let cms = ta_le4(ui8a.slice(pos, pos += 4)); // compressed size
                    let ucs = ta_le4(ui8a.slice(pos, pos += 4)); // uncompressed size
                    let fnl = ta_le2(ui8a.slice(pos, pos += 2)); // file name length (n)
                    let efl = ta_le2(ui8a.slice(pos, pos += 2)); // extra field length (m)
                    let fnv = ta_str(ui8a.slice(pos, pos += fnl)); // file name value
                    let efv = (ui8a.slice(pos, pos += efl)); // extra field value
                    let data = (ui8a.slice(pos, pos += cms));
                    return Object.assign({}, { ver, gen, com, lmt, lmd, crc, cms, ucs, fnl, efl, fnv, efv, data });
                }
                catch (e) {
                    if (e.message.startsWith('ZipFileEntry')) return false;
                    else throw e;
                }
            }
            function get_central_directory(ui8a) {
                try {
                    let sig = ta_le4(ui8a.slice(pos, pos += 4)); // central file header signature   4 bytes  (0x02014b50)
                    if (sig !== central_file_header_signature) {
                        pos -= 4;
                        throw new Error(`ZipDirectoryRecord: central_file_header_signature did not match`);
                    }
                    let vmb = ta_le2(ui8a.slice(pos, pos += 2)); // version made by                 2 bytes
                    let mev = ta_le2(ui8a.slice(pos, pos += 2)); // version needed to extract       2 bytes // minimum extraction version
                    let gpf = ta_le2(ui8a.slice(pos, pos += 2)); // general purpose bit flag        2 bytes
                    let com = ta_le2(ui8a.slice(pos, pos += 2)); // compression method              2 bytes
                    let lmt = ta_le2(ui8a.slice(pos, pos += 2)); // last mod file time              2 bytes
                    let lmd = ta_le2(ui8a.slice(pos, pos += 2)); // last mod file date              2 bytes
                    let crc = ta_le4(ui8a.slice(pos, pos += 4)); // crc-32                          4 bytes
                    let cms = ta_le4(ui8a.slice(pos, pos += 4)); // compressed size                 4 bytes
                    let ucs = ta_le4(ui8a.slice(pos, pos += 4)); // uncompressed size               4 bytes
                    let fnl = ta_le2(ui8a.slice(pos, pos += 2)); // file name length (n)            2 bytes
                    let efl = ta_le2(ui8a.slice(pos, pos += 2)); // extra field length (m)          2 bytes
                    let fcl = ta_le2(ui8a.slice(pos, pos += 2)); // file comment length (k)         2 bytes
                    let dns = ta_le2(ui8a.slice(pos, pos += 2)); // disk number start               2 bytes
                    let ifa = ta_le2(ui8a.slice(pos, pos += 2)); // internal file attributes        2 bytes
                    let efa = ta_le4(ui8a.slice(pos, pos += 4)); // external file attributes        4 bytes
                    let hro = ta_le4(ui8a.slice(pos, pos += 4)); // relative offset of local header 4 bytes
                    let fnv = ta_str(ui8a.slice(pos, pos += fnl)); // file name
                    let efv = (ui8a.slice(pos, pos += efl)); // extra field value
                    let fcv = (ui8a.slice(pos, pos += fcl)); // file comment
                    return Object.assign({}, { vmb, mev, gpf, com, lmt, lmd, crc, cms, ucs, fnl, efl, fcl, dns, ifa, efa, hro, fnv, efv, fcv });
                }
                catch (e) {
                    if (e.message.startsWith('ZipDirectoryRecord')) return false;
                    else throw e;
                }
            }
            function get_central_directory_end(ui8a) {
                let a00 = ta_le4(ui8a.slice(pos, pos += 4)); // end of central dir signature                                                   4 bytes  (0x06054b50)
                console.assert(a00 === end_of_central_directory_signature);
                let a01 = ta_le2(ui8a.slice(pos, pos += 2)); // number of this disk                                                            2 bytes
                let a02 = ta_le2(ui8a.slice(pos, pos += 2)); // number of the disk with the start of the central directory                     2 bytes
                let a03 = ta_le2(ui8a.slice(pos, pos += 2)); // total number of entries in the central directory on this disk                  2 bytes
                let a04 = ta_le2(ui8a.slice(pos, pos += 2)); // total number of entries in the central directory                               2 bytes
                let a05 = ta_le4(ui8a.slice(pos, pos += 4)); // size of the central directory                                                  4 bytes
                let a06 = ta_le4(ui8a.slice(pos, pos += 4)); // offset of start of central directory with respect to the starting disk number  4 bytes
                let a07 = ta_le2(ui8a.slice(pos, pos += 2)); // .ZIP file comment length                                                       2 bytes
                let a08 = ta_str(ui8a.slice(pos, pos += a07)); // .ZIP file comment                                                    (variable size)
            }
            
            let uia = new Uint8Array(ab);

            // file entries
            let files = new Array();
            let fe;
            while ((fe = get_file_entry(uia)) !== false) {
                files.push(new ZipFileEntry(fe));
            }

            // central directory records
            let records = new Array();
            let de;
            for (let i = 0; i < files.length; i++) {
                records.push(get_central_directory(uia));
            }

            // meta :: end of cetral directory record
            const meta = get_central_directory_end(uia);

            files.forEach((v,i) => {
                this.set(v.name, v);
            });
        }
    }

    if (typeof module !== 'undefined' && 'exports' in module) {
        module.exports = ZipFile;
    }
    else {
        this.ZipFile = ZipFile;
    }
})();
