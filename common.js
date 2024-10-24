'use strict'

const path = require('path')
const semver = require('semver')

const ltsNames = {
  4: 'argon',
  6: 'boron',
  8: 'carbon',
  10: 'dubnium',
  12: 'erbium',
  14: 'fermium',
  16: 'gallium',
  18: 'hydrogen',
  20: 'iron',
  22: 'jod'
}

class Linker {
  #links = new Map()
  #dirs = []
  #baseDir
  #docsDir
  constructor ({ baseDir, docsDir }) {
    this.#baseDir = baseDir
    this.#docsDir = docsDir
  }

  async getLinks (allDirectories, readDir) {
    const allDirs = allDirectories
      .map((d) => path.basename(d))
      .map((d) => {
        try {
          return semver.parse(d)
          /* c8 ignore next 3 */
        } catch (e) {
          return null
        }
      })
      .filter(Boolean)

    this.#makeDocsLinks(allDirs.map((d) => d.raw))

    this.#dirs = allDirs.filter((d) => semver.satisfies(d, '~0.10 || ~0.12 || >= 1.0')).map((d) => d.raw)
    this.#dirs.sort((d1, d2) => semver.compare(d1, d2))

    this.#link('0.10')
    this.#link(0.12)

    for (let i = 1; ; i++) {
      if (!this.#link(i) && i >= 4) {
        break
      }
    }

    const max = this.#link(null)
    const tbreg = new RegExp(`(\\w+)-${max}.tar.gz`)
    const latestDir = path.join(this.#baseDir, 'latest')

    let tarball = (await readDir(this.#links.get(latestDir) || latestDir)).filter((f) => tbreg.test(f))

    /* c8 ignore next 3 */
    if (tarball.length !== 1) {
      throw new Error('Could not find latest.tar.gz')
    }

    tarball = tarball[0]
    const name = tarball.match(tbreg)[1]
    const dst = path.join(this.#baseDir, `${name}-latest.tar.gz`)
    this.#links.set(dst, path.join(this.#baseDir, 'latest', tarball))
    return this.#links
  }

  #makeDocsLinks (versions) {
    if (!this.#docsDir) {
      return
    }

    for (const version of versions) {
      const src = path.join(this.#baseDir, version, 'docs')
      const dst = path.join(this.#docsDir, version)
      this.#links.set(dst, src)
    }
  }

  #link (version) {
    const line = version && `${version}.x`
    const range = version ? `${Number(version) < 1 ? '~' : '^'}${line}` : '*'
    const max = semver.maxSatisfying(this.#dirs, range)

    if (!max) {
      return false
    }

    const symlink = (name) => {
      const dst = path.join(this.#baseDir, name)
      const src = path.join(this.#baseDir, max)

      this.#links.set(dst, src)

      if (!this.#docsDir) {
        return
      }

      const dsrc = path.join(this.#baseDir, max, 'docs')
      const ddst = path.join(this.#docsDir, name)
      this.#links.set(ddst, dsrc)
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
}

module.exports = {
  Linker
}
