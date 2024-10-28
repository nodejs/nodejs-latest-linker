#!/usr/bin/env node

'use strict'

const fs = require('fs/promises')
const path = require('path')
const { Linker } = require('./common.js')

/* c8 ignore next 3 */
if (process.argv.length < 3) {
  throw new Error('Usage: latest-linker.js <downloads directory> [docs directory]')
}

const dir = path.resolve(process.argv[2])
const docsDir = process.argv[3] && path.resolve(process.argv[3])

async function validateDocsLink (src) {
  try {
    const stat = await fs.stat(src)
    return stat.isDirectory()
  } catch {
    return false
  }
}

(async function main () {
  /* c8 ignore next 3 */
  if (!(await fs.stat(dir)).isDirectory()) {
    throw new Error('Usage: latest-linker.js <downloads directory> [docs directory]')
  }

  /* c8 ignore next 3 */
  if (docsDir && !(await fs.stat(docsDir)).isDirectory()) {
    throw new Error('Usage: latest-linker.js <downloads directory> [docs directory]')
  }

  const allDirs = (await fs.readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)
  const linker = new Linker({ baseDir: dir, docsDir, validateDocsLink })
  const links = await linker.getLinks(allDirs, fs.readdir)
  for (const [dest, src] of links) {
    await fs.unlink(dest).catch(() => {})
    await fs.symlink(src, dest)
  }
})()
