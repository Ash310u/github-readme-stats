import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const themes = {
  light: {
    background: "#ffffff",
    border: "#d0d7de",
    title: "#0969da",
    text: "#24292f",
    muted: "#57606a",
    accent: "#2da44e"
  },
  dark: {
    background: "#0d1117",
    border: "#30363d",
    title: "#58a6ff",
    text: "#c9d1d9",
    muted: "#8b949e",
    accent: "#3fb950"
  }
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=300",
    ...headers
  });
  response.end(body);
}

function sendJson(response, status, payload) {
  send(response, status, JSON.stringify(payload, null, 2), {
    "Content-Type": "application/json; charset=utf-8"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function githubRequest(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "new-github-stats"
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com${path}`, { headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || `GitHub request failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function fetchAllUserRepos(username) {
  const repos = [];
  let page = 1;

  while (page <= 10) {
    const pageRepos = await githubRequest(
      `/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}`
    );

    repos.push(...pageRepos);

    if (pageRepos.length < 100) {
      break;
    }

    page += 1;
  }

  return repos;
}

async function githubSearch(path, query, perPage = 1) {
  return githubRequest(
    `${path}?q=${encodeURIComponent(query)}&per_page=${perPage}`
  );
}

function collectSearchRepositories(searchResults) {
  return searchResults.items
    .map((item) => item.repository?.full_name || item.repository_url)
    .filter(Boolean);
}

async function fetchGithubStats(username) {
  const login = encodeURIComponent(username);
  const [user, repos, commits, pullRequests, issues] = await Promise.all([
    githubRequest(`/users/${login}`),
    fetchAllUserRepos(username),
    githubSearch("/search/commits", `author:${username}`, 100),
    githubSearch("/search/issues", `type:pr author:${username}`, 100),
    githubSearch("/search/issues", `type:issue author:${username}`, 100)
  ]);

  const contributedRepositories = new Set([
    ...collectSearchRepositories(commits),
    ...collectSearchRepositories(pullRequests),
    ...collectSearchRepositories(issues)
  ]);

  return {
    username: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalCommits: commits.total_count,
    totalPullRequests: pullRequests.total_count,
    totalIssues: issues.total_count,
    contributedTo: contributedRepositories.size,
    createdAt: user.created_at
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function renderStat(label, value, x, y, theme) {
  return `
    <text x="${x}" y="${y}" fill="${theme.muted}" font-size="13">${label}</text>
    <text x="${x}" y="${y + 24}" fill="${theme.text}" font-size="22" font-weight="700">${formatNumber(value)}</text>
  `;
}

function renderSvg(stats, themeName) {
  const theme = themes[themeName] || themes.light;
  const displayName = stats.name || stats.username;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="640" height="270" viewBox="0 0 640 270" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHtml(displayName)} GitHub stats</title>
  <desc id="desc">GitHub profile statistics for ${escapeHtml(stats.username)}</desc>
  <rect x="0.5" y="0.5" width="639" height="269" rx="8" fill="${theme.background}" stroke="${theme.border}"/>
  <text x="28" y="42" fill="${theme.title}" font-family="Segoe UI, Ubuntu, sans-serif" font-size="22" font-weight="700">${escapeHtml(displayName)}</text>
  <text x="28" y="67" fill="${theme.muted}" font-family="Segoe UI, Ubuntu, sans-serif" font-size="14">@${escapeHtml(stats.username)}</text>
  <line x1="28" y1="92" x2="612" y2="92" stroke="${theme.border}"/>
  <g font-family="Segoe UI, Ubuntu, sans-serif">
    ${renderStat("Total Stars", stats.totalStars, 28, 128, theme)}
    ${renderStat("Total Commits", stats.totalCommits, 228, 128, theme)}
    ${renderStat("Total PRs", stats.totalPullRequests, 428, 128, theme)}
    ${renderStat("Total Issues", stats.totalIssues, 28, 202, theme)}
    ${renderStat("Contributed To", stats.contributedTo, 228, 202, theme)}
    <text x="612" y="234" text-anchor="end" fill="${theme.muted}" font-size="13">new-github-stats</text>
  </g>
</svg>`;
}

async function handleStats(request, response, url) {
  const username = url.searchParams.get("username");
  const format = url.searchParams.get("format") || "svg";
  const theme = url.searchParams.get("theme") || "light";

  if (!username) {
    sendJson(response, 400, {
      error: "Missing required query parameter: username"
    });
    return;
  }

  try {
    const stats = await fetchGithubStats(username);

    if (format === "json") {
      sendJson(response, 200, stats);
      return;
    }

    send(response, 200, renderSvg(stats, theme), {
      "Content-Type": "image/svg+xml; charset=utf-8"
    });
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: error.message || "Unable to fetch GitHub stats"
    });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/stats") {
    await handleStats(request, response, url);
    return;
  }

  if (url.pathname === "/" || url.pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      endpoint: "/api/stats?username=octocat"
    });
    return;
  }

  sendJson(response, 404, {
    error: "Not found"
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Try PORT=3001 npm run dev.`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`new-github-stats listening on http://${HOST}:${PORT}`);
});
