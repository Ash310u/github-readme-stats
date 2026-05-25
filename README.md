# New GitHub Stats

A separate, dependency-free API project for creating GitHub stats cards.

## Run

```bash
npm start
```

The server starts on `http://localhost:3000`.

## API

```text
GET /api/stats?username=octocat
```

Returns an SVG stats card.

```text
GET /api/stats?username=octocat&theme=github_dark
```

Returns the same SVG stats card with the GitHub dark theme.

```text
GET /api/stats?username=octocat&format=json
```

Returns the raw stats as JSON:

```json
{
  "username": "octocat",
  "name": "The Octocat",
  "totalStars": 123,
  "totalCommits": 456,
  "totalPullRequests": 78,
  "totalIssues": 9,
  "contributedTo": 12
}
```

## Optional GitHub Token

Unauthenticated GitHub API requests are rate-limited. For higher limits, set:

```bash
GITHUB_TOKEN=your_token npm start
```

## Options

- `username`: required GitHub username.
- `format`: `svg` or `json`, defaults to `svg`.
- `theme`: `github_light` or `github_dark`, defaults to `github_light`.

Short aliases also work:

- `light`
- `dark`

## Stats Shown

- Total stars across the user's public repositories.
- Total commits authored by the user.
- Total pull requests opened by the user.
- Total issues opened by the user.
- Repositories contributed to, counted from returned commit, pull request, and issue search results.
