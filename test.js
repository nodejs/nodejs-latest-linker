'use strict'

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const tap = require('tap')

tap.test('basic test', t => {
  const dir = t.testdir({
    'v4.0.0': {
      'node-v4.0.0.tar.gz': ''
    },
    'v4.1.0': {
      'node-v4.1.0.tar.gz': ''
    }
  })
  const targetDir = path.join(dir, 'v4.1.0')
  const links = [
    ['latest', targetDir],
    ['latest-argon', targetDir],
    ['latest-v4.x', targetDir],
    ['node-latest.tar.gz', path.join(dir, 'latest', 'node-v4.1.0.tar.gz')]
  ]
  execFileSync(process.execPath, ['latest-linker.js', dir])
  for (const [link, target] of links) {
    const src = path.join(dir, link)
    t.ok(fs.existsSync(src), `${link} was created`)
    const stats = fs.lstatSync(src)
    t.ok(stats.isSymbolicLink(), `${link} is a symbolic link`)
    t.same(fs.readlinkSync(src), target, `${link} points to ${target}`)
  }
  t.end()
})
