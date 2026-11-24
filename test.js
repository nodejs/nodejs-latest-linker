'use strict'

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const tap = require('tap')
const { Linker } = require('./common.js')

tap.test('Linker', async t => {
  const linker = new Linker({ baseDir: 'base', docsDir: 'docs' })
  const links = await linker.getLinks(
    ['v19.8.0/', 'v19.8.1/', 'v19.9.0/', 'v20.7.0/', 'v20.8.0/'],
    async () => ['docs/', 'win-x64/', 'node-v20.8.0-aix-ppc64.tar.gz', 'node-v20.8.0-arm64.msi', 'node-v20.8.0-headers.tar.gz', 'node-v20.8.0.tar.gz']
  )
  t.same(links, new Map([
    ['base/latest-v19.x', 'base/v19.9.0'],
    ['docs/latest-v19.x', 'base/v19.9.0/docs'],
    ['base/latest-v20.x', 'base/v20.8.0'],
    ['docs/latest-v20.x', 'base/v20.8.0/docs'],
    ['base/latest-iron', 'base/v20.8.0'],
    ['docs/latest-iron', 'base/v20.8.0/docs'],
    ['docs/v19.8.0', 'base/v19.8.0/docs'],
    ['docs/v19.8.1', 'base/v19.8.1/docs'],
    ['docs/v19.9.0', 'base/v19.9.0/docs'],
    ['docs/v20.7.0', 'base/v20.7.0/docs'],
    ['docs/v20.8.0', 'base/v20.8.0/docs'],
    ['base/latest', 'base/v20.8.0'],
    ['docs/latest', 'base/v20.8.0/docs'],
    ['base/node-latest.tar.gz', 'base/latest/node-v20.8.0.tar.gz']
  ]))
  t.end()
})

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

tap.test('latest does not link to alphas', async t => {
  const linker = new Linker({ baseDir: 'base', docsDir: 'docs' })
  const fakeReaddir = async (v) => {
    const version = path.basename(v)
    // Mimimum expected content are the `docs` directory, and
    // the source tarball which gets mapped to `nodejs-latest.tar.gz`.
    return ['docs/', `node-${version}.tar.gz`]
  }
  const expected = []
  const fixtures = []
  for (const version of ['v26.13.0', 'v27.0.0-alpha.0.0.0']) {
    const line = version.split('.')[0]
    fixtures.push(version)
    // Link under docs
    expected.push([`docs/${version}`, `base/${version}/docs`])
    // `latest-v.x` links
    expected.push([`base/latest-${line}.x`, `base/${version}`])
    expected.push([`docs/latest-${line}.x`, `base/${version}/docs`])
  }
  // v26.13.0 should result in `latest-lithium` links
  expected.push(['base/latest-lithium', 'base/v26.13.0'])
  expected.push(['docs/latest-lithium', 'base/v26.13.0/docs'])
  // Expect `latest` to point to the non-alpha release
  expected.push(['base/latest', 'base/v26.13.0'])
  expected.push(['base/node-latest.tar.gz', 'base/latest/node-v26.13.0.tar.gz'])
  expected.push(['docs/latest', 'base/v26.13.0/docs'])

  const links = await linker.getLinks(fixtures, fakeReaddir)
  t.same(links, new Map(expected))
  t.end()
})

tap.test('alphas are ignored after current release', async t => {
  const linker = new Linker({ baseDir: 'base', docsDir: 'docs' })
  const fakeReaddir = async (v) => {
    const version = path.basename(v)
    // Mimimum expected content are the `docs` directory, and
    // the source tarball which gets mapped to `nodejs-latest.tar.gz`.
    return ['docs/', `node-${version}.tar.gz`]
  }
  const expected = []
  const fixtures = []
  for (const version of ['v26.13.0', 'v27.0.0-alpha.0.0.0', 'v27.0.0']) {
    const line = version.split('.')[0]
    fixtures.push(version)
    // Link under docs
    expected.push([`docs/${version}`, `base/${version}/docs`])
    // `latest-v.x` links
    expected.push([`base/latest-${line}.x`, `base/${version}`])
    expected.push([`docs/latest-${line}.x`, `base/${version}/docs`])
  }
  // v26.13.0 should result in `latest-lithium` links
  expected.push(['base/latest-lithium', 'base/v26.13.0'])
  expected.push(['docs/latest-lithium', 'base/v26.13.0/docs'])
  // TODO: test will need to be updated to expect `latest-magnesium`
  // when mapping in `common.js` is in place for `27: 'magnesium'`.
  // Expect `latest` to point to the non-alpha 27.0.0 release
  expected.push(['base/latest', 'base/v27.0.0'])
  expected.push(['base/node-latest.tar.gz', 'base/latest/node-v27.0.0.tar.gz'])
  expected.push(['docs/latest', 'base/v27.0.0/docs'])

  const links = await linker.getLinks(fixtures, fakeReaddir)
  t.same(links, new Map(expected))
  t.end()
})
