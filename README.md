# GitHub Stats

A growing API for generating GitHub stats cards, contribution charts, and profile widgets for README profiles, websites, and dashboards.

![GitHub stats card preview](./profile_ss.png)

## Use The API

Use the main stats card directly in Markdown:

```md
![GitHub Stats](https://api-github-readme-stats.vercel.app/api/stats?username=Ash310u)
```

Use the contribution chart with the same clean default card design:

```md
![GitHub Contribution Chart](https://api-github-readme-stats.vercel.app/api/stats/chart?username=Ash310u)
```

Use a dark GitHub-style theme:

```md
![GitHub Stats](https://api-github-readme-stats.vercel.app/api/stats?username=Ash310u&theme=github_dark)
```

Get raw JSON instead of an SVG:

```text
https://api-github-readme-stats.vercel.app/api/stats?username=Ash310u&format=json
https://api-github-readme-stats.vercel.app/api/stats/chart?username=Ash310u&format=json
```

## Endpoints

| Endpoint | Description |
| --- | --- |
| `/api/stats` | Summary card with stars, commits, pull requests, issues, and repositories contributed to. |
| `/api/stats/chart` | Modern contribution chart with total contributions, current streak, and longest streak. |
| `/health` | Health check with available endpoint examples. |

## Settings

| Query | Required | Default | Values | Description |
| --- | --- | --- | --- | --- |
| `username` | Yes | none | Any GitHub username | The profile to show stats for. |
| `theme` | No | `github_light` | `github_light`, `github_dark`, `light`, `dark` | Changes the SVG colors. |
| `format` | No | `svg` | `svg`, `json` | Returns an image card or raw stats data. |
| `from` | No | Jan 1 of the current year | `YYYY-MM-DD` | Chart-only start date for contribution data. |
| `to` | No | Today | `YYYY-MM-DD` | Chart-only end date for contribution data. |

## Stats Shown

The summary card shows:

- Total stars across the user's public repositories.
- Total commits authored by the user.
- Total pull requests opened by the user.
- Total issues opened by the user.
- Repositories contributed to, counted from returned commit, pull request, and issue search results.

The contribution chart shows:

- Total contributions in the selected date range.
- Current contribution streak.
- Longest contribution streak.

## GitHub Token

`GITHUB_TOKEN` is a GitHub personal access token used by the server when it calls the GitHub API.

The summary card can run without a token, but GitHub gives unauthenticated requests a much smaller rate limit. The contribution chart uses GitHub GraphQL, so it needs `GITHUB_TOKEN` for reliable chart data.

If you deploy this for other people to use, add `GITHUB_TOKEN` to your hosting provider's environment variables so the cards do not fail after a small number of requests.

Do not put the token in your README, browser URL, frontend code, or API query params. Keep it only in server environment variables.

For Vercel:

```text
Project Settings -> Environment Variables -> GITHUB_TOKEN
```

For local development, create a `.env` file or run:

```bash
GITHUB_TOKEN=your_token npm start
```

If a real token is ever shared publicly, revoke it in GitHub and create a new one.

## Project Structure

```text
src/
  config/          Environment and runtime config
  controllers/     Request handlers for API endpoints
  http/            Router and response helpers
  renderers/       Shared class-based SVG renderers for cards and charts
  services/        GitHub REST, GraphQL, and stats data logic
  utils/           Formatting and escaping helpers
  server.js        Node HTTP server entrypoint
```

## Run Locally

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Start in watch mode:

```bash
npm run dev
```

The server starts on:

```text
http://localhost:3000
```

Try it locally:

```text
http://localhost:3000/api/stats?username=Ash310u
http://localhost:3000/api/stats/chart?username=Ash310u
```

If port `3000` is already busy, use another port:

```bash
PORT=3001 npm run dev
```

## Contributing

Contributions are welcome. You can help by improving card design, adding themes, adding more stat options, improving docs, or fixing API behavior.

Before opening a pull request:

1. Run the project locally.
2. Test the SVG endpoint and JSON endpoint.
3. Keep tokens and local secrets out of commits.
4. Update the README when adding or changing API options.
