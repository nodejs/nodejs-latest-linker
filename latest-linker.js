#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const semver = require('semver')
const map = require('map-async')

const ltsNames = {
  4: 'argon',
  6: 'boron',
  8: 'carbon',
  10: 'dubnium',
  12: 'erbium'
}

if (process.argv.length < 3) {
  throw new Error('Usage: latest-linker.js <downloads directory> [docs directory]')
}

const dir = path.resolve(process.argv[2])
const docsDir = process.argv[3] && path.resolve(process.argv[3])

if (!fs.statSync(dir).isDirectory()) {
  throw new Error('Usage: latest-linker.js <downloads directory> [docs directory]')
}

if (docsDir && !fs.statSync(docsDir).isDirectory()) {
  throw new Error('Usage: latest-linker.js <downloads directory> [docs directory]')
}

map(
  fs.readdirSync(dir).map((d) => path.join(dir, d)),
  (d, callback) => fs.stat(d, (_, stat) => callback(null, { d, stat })),
  afterMap
)

function afterMap (err, allDirs) {
  if (err) {
    throw err
  }

  allDirs = allDirs.filter((d) => d.stat && d.stat.isDirectory())
    .map((d) => path.basename(d.d))
    .map((d) => {
      try {
        return semver(d)
      } catch (e) {}
    })
    .filter(Boolean)

  makeDocsLinks(allDirs.map((v) => v.raw))

  const dirs = allDirs.filter((d) => semver.satisfies(d, '~0.10 || ~0.12 || >= 1.0'))
    .map((d) => d.raw)

  dirs.sort((d1, d2) => semver.compare(d1, d2))

  link('0.10', dirs)
  link(0.12, dirs)

  for (let i = 1; ; i++) {
    if (!link(i, dirs) && i >= 4) {
      break
    }
  }

  const max = link(null, dirs)
  const tbreg = new RegExp(`(\\w+)-${max}.tar.gz`)

  let tarball = fs.readdirSync(path.join(dir, 'latest'))
    .filter((f) => tbreg.test(f))

  if (tarball.length !== 1) {
    throw new Error('Could not find latest.tar.gz')
  }

  tarball = tarball[0]
  const name = tarball.match(tbreg)[1]
  const dst = path.join(dir, `${name}-latest.tar.gz`)
  try {
    fs.unlinkSync(dst)
  } catch (e) {}
  fs.symlinkSync(path.join(dir, 'latest', tarball), dst)
}

function makeDocsLinks (versions) {
  if (!docsDir) {
    return
  }

  versions.forEach((version) => {
    const src = path.join(dir, version, 'docs')
    const dst = path.join(docsDir, version)

    fs.stat(src, (err, stat) => {
      if (err || !stat.isDirectory()) {
        return
      }

      fs.unlink(dst, () => {
        fs.symlink(src, dst, (err) => {
          if (err) {
            throw err
          }
        })
      })
    })
  })
}

function link (version, dirs) {
  const line = version && `${version}.x`
  const range = version ? `${Number(version) < 1 ? '~' : '^'}${line}` : '*'
  const max = semver.maxSatisfying(dirs, range)

  if (!max) {
    return false
  }

  function symlink (name) {
    const dst = path.join(dir, name)
    const src = path.join(dir, max)

    try {
      fs.unlinkSync(dst)
    } catch (e) {}
    fs.symlinkSync(src, dst)

    if (!docsDir) {
      return
    }

    const dsrc = path.join(dir, max, 'docs')
    const ddst = path.join(docsDir, name)

    try {
      fs.unlinkSync(ddst)
    } catch (e) {}
    fs.symlinkSync(dsrc, ddst)
  }

  if (line) {
    symlink(`latest-v${line}`)
    if (ltsNames[version]) {
      symlink(`latest-${ltsNames[version]}`)
    }
  } else {
    symlink('latest')
  }

  return max
}
