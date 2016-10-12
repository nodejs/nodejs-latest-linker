# nodejs-latest-linker

**An application to create latest-X symlinks at https://nodejs.org/download/release/ after each new release**

Also works for iojs.org.

Symlinks created by **nodejs-latest-linker** when run are:

* **[latest-v0.10.x](https://nodejs.org/download/release/latest-v0.10.x)** and **[latest-v0.12.x](https://nodejs.org/download/release/latest-v0.12.x)**: special cases for old branches, pointing to the latest release on each line
* **latest-v_X_.x** (e.g. [latest-v6.x](https://nodejs.org/download/release/latest-v6.x): where _X_ is a semver-major version starting at 4 for Node.js (1 for io.js), pointing to the latest release on each line
* **latest-_ltsname_** (e.g. [latest-boron](https://nodejs.org/download/release/latest-boron): where _ltsname_ is the LTS codename, e.g. "argon" or "boron", pointing to the latest release on each LTS line
* **latest**: pointing to the release with the highest semver, any line
* **[node-latest.tar.gz](https://nodejs.org/download/release/node-latest.tar.gz)**: pointing to the source tarball of the release with the highest semver, any line, exists for legacy reasons

The same directory symlinks are also created for API docs, here: https://nodejs.org/download/docs/

## Usage

```
$ nodejs-latest-linker.js <downloads directory> [docs directory]
```

-----------------------------------

Managed under the governance of the Node.js [Build Working Group](https://github.com/nodejs/build).

Copyright (c) 2016 Node.js Foundation. All rights reserved.

Licensed under MIT, see the LICENSE.md file for details
