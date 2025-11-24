const fs = require('fs')
const path = require('path')

function exists(p) {
  try {
    return fs.existsSync(p)
  } catch (e) { return false }
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch (e) { return null }
}

async function scanProject(folder) {
  if (!folder) throw new Error('No folder provided')
  const files = fs.readdirSync(folder)
  const result = { path: folder, manifests: [] }

  // npm
  const pkgJson = path.join(folder, 'package.json')
  if (exists(pkgJson)) {
    const pkg = readJSON(pkgJson)
    result.manifests.push({ manager: 'npm', file: 'package.json', data: pkg })
  }

  // yarn / pnpm lockfiles
  ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml'].forEach(f => {
    const p = path.join(folder, f)
    if (exists(p)) result.manifests.push({ manager: 'npm-lock', file: f })
  })

  // python
  ['requirements.txt', 'Pipfile', 'pyproject.toml', 'poetry.lock'].forEach(f => {
    const p = path.join(folder, f)
    if (exists(p)) result.manifests.push({ manager: 'python', file: f })
  })

  // rust
  ['Cargo.toml', 'Cargo.lock'].forEach(f => {
    const p = path.join(folder, f)
    if (exists(p)) result.manifests.push({ manager: 'cargo', file: f })
  })

  return result
}

module.exports = { scanProject }
