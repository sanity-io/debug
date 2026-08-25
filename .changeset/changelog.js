// @env node

const CONVENTIONAL_COMMIT_RE = /^([a-z]+)(?:\(([^)]+)\))?!?:\s*([\s\S]+)/

async function getPullRequestInfo(commit, repo) {
  const token = process.env.GITHUB_TOKEN
  if (!token || !commit || !repo) return null

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/commits/${commit}/pulls`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) return null

    const pulls = await response.json()
    return pulls[0] ? {number: pulls[0].number, title: pulls[0].title} : null
  } catch {
    return null
  }
}

function parsePullRequestNumber(id) {
  const match = id.match(/^pr-(\d+)$/)
  return match ? Number.parseInt(match[1], 10) : null
}

async function getReleaseLine(changeset, _type, options) {
  const repo = options?.repo
  const {commit, id, summary} = changeset
  const trimmedSummary = summary.trim()

  let pullRequestNumber = parsePullRequestNumber(id)
  let pullRequestTitle = null

  if (!pullRequestNumber && commit && repo) {
    const pullRequest = await getPullRequestInfo(commit, repo)
    if (pullRequest) {
      pullRequestNumber = pullRequest.number
      pullRequestTitle = pullRequest.title
    }
  }

  const source = trimmedSummary.match(CONVENTIONAL_COMMIT_RE) ? trimmedSummary : pullRequestTitle
  const conventionalCommit = source?.match(CONVENTIONAL_COMMIT_RE)
  const scope = conventionalCommit?.[2] || null
  const description = conventionalCommit ? conventionalCommit[3].trim() : trimmedSummary
  const [firstLine, ...restLines] = description.split('\n')
  const scopePrefix = scope ? `**${scope}:** ` : ''
  const pullRequestLink =
    pullRequestNumber && repo
      ? ` ([#${pullRequestNumber}](https://github.com/${repo}/pull/${pullRequestNumber}))`
      : ''
  const commitLink =
    commit && repo ? ` ([${commit.slice(0, 7)}](https://github.com/${repo}/commit/${commit}))` : ''

  const formatted = `${scopePrefix}${firstLine}${pullRequestLink}${commitLink}`
  if (restLines.length > 0) {
    return `- ${formatted}\n${restLines.map((line) => (line ? `  ${line}` : line)).join('\n')}`
  }

  return `- ${formatted}`
}

async function getDependencyReleaseLine(_changesets, dependenciesUpdated) {
  if (dependenciesUpdated.length === 0) return ''

  const updates = dependenciesUpdated.map(
    (dependency) => `    - ${dependency.name} bumped to ${dependency.newVersion}`,
  )

  return [
    '',
    '- The following workspace dependencies were updated',
    '  - dependencies',
    ...updates,
  ].join('\n')
}

export default {
  getDependencyReleaseLine,
  getReleaseLine,
}
