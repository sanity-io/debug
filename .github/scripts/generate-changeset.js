// @env node

import {randomUUID} from 'node:crypto'
import {appendFileSync} from 'node:fs'

const {
  GH_TOKEN,
  GITHUB_OUTPUT,
  GITHUB_REPOSITORY,
  PR_BODY = '',
  PR_HEAD_SHA,
  PR_NUMBER,
  PR_REPO,
  PR_TITLE,
} = process.env

if (
  !GH_TOKEN ||
  !GITHUB_REPOSITORY ||
  !GITHUB_OUTPUT ||
  !PR_HEAD_SHA ||
  !PR_NUMBER ||
  !PR_TITLE ||
  !PR_REPO
) {
  throw new Error(
    'Missing required environment variables: GH_TOKEN, GITHUB_REPOSITORY, GITHUB_OUTPUT, PR_HEAD_SHA, PR_NUMBER, PR_TITLE, PR_REPO',
  )
}

const PACKAGE_NAME = '@sanity/debug'
const RELEVANT_PATHS = ['src/', 'package.json', 'tsdown.config.ts', 'tsconfig.dist.json']
const CHANGESET_FILE = `.changeset/pr-${PR_NUMBER}.md`
const AUTO_GENERATED_MARKER = '<!-- auto-generated -->'

async function githubApi(path) {
  const url = path.startsWith('https://') ? path : `https://api.github.com${path}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GH_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${await response.text()}`)
  }

  return response.json()
}

function setOutput(key, value) {
  appendFileSync(GITHUB_OUTPUT, `${key}=${value}\n`)
}

function parseConventionalCommit(title) {
  const match = title.match(/^([a-z]+)(\((.+)\))?(!)?:\s.+/)
  if (!match) return null

  return {breaking: match[4] === '!', type: match[1]}
}

function determineBump(type, breaking, body) {
  if (breaking) return 'major'
  if (body.split('\n').some((line) => line.startsWith('BREAKING CHANGE:'))) return 'major'
  if (type === 'feat') return 'minor'
  if (['fix', 'perf', 'revert'].includes(type)) return 'patch'
  return null
}

async function getChangedFiles() {
  const files = []
  let page = 1

  while (true) {
    const data = await githubApi(
      `/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/files?per_page=100&page=${page}`,
    )
    if (data.length === 0) break

    files.push(...data.map((file) => file.filename))
    page++
  }

  return files
}

async function getExistingChangeset() {
  const url = `https://api.github.com/repos/${PR_REPO}/contents/${CHANGESET_FILE}?ref=${PR_HEAD_SHA}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GH_TOKEN}`,
    },
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  return Buffer.from(data.content, 'base64').toString()
}

const changedFiles = await getChangedFiles()
const existingChangeset = await getExistingChangeset()

if (existingChangeset === null) {
  const manualChangesets = changedFiles.filter(
    (file) =>
      file.startsWith('.changeset/') &&
      file.endsWith('.md') &&
      file !== '.changeset/README.md' &&
      file !== CHANGESET_FILE,
  )

  if (manualChangesets.length > 0) {
    console.log(`Skipping because this pull request has a manual changeset: ${manualChangesets}`)
    setOutput('action', 'skip')
    process.exit(0)
  }
} else if (!existingChangeset.startsWith(AUTO_GENERATED_MARKER)) {
  console.log('Skipping because the generated changeset was edited manually')
  setOutput('action', 'skip')
  process.exit(0)
}

const parsed = parseConventionalCommit(PR_TITLE)
if (!parsed) {
  console.log('::warning::Pull request title does not use the conventional commit format')
  setOutput('action', existingChangeset === null ? 'skip' : 'remove')
  if (existingChangeset !== null) setOutput('changeset_file', CHANGESET_FILE)
  process.exit(0)
}

const bump = determineBump(parsed.type, parsed.breaking, PR_BODY)
if (!bump) {
  console.log(`Pull request type '${parsed.type}' does not require a changeset`)
  setOutput('action', existingChangeset === null ? 'skip' : 'remove')
  if (existingChangeset !== null) setOutput('changeset_file', CHANGESET_FILE)
  process.exit(0)
}

const affectsPackage = changedFiles.some((file) =>
  RELEVANT_PATHS.some((path) => (path.endsWith('/') ? file.startsWith(path) : file === path)),
)

if (!affectsPackage) {
  console.log('No published package files changed')
  setOutput('action', existingChangeset === null ? 'skip' : 'remove')
  if (existingChangeset !== null) setOutput('changeset_file', CHANGESET_FILE)
  process.exit(0)
}

const changesetContent = `${AUTO_GENERATED_MARKER}\n---\n'${PACKAGE_NAME}': ${bump}\n---\n\n${PR_TITLE}\n`

setOutput('action', 'write')
setOutput('changeset_file', CHANGESET_FILE)

const delimiter = `CHANGESET_EOF_${randomUUID().replaceAll('-', '')}`
appendFileSync(GITHUB_OUTPUT, `changeset_content<<${delimiter}\n${changesetContent}${delimiter}\n`)
