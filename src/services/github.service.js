import { config } from "../config/env.js";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

function createHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-stats"
  };

  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`;
  }

  return headers;
}

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function githubRequest(path) {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: createHeaders()
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createError(
      data.message || `GitHub request failed with ${response.status}`,
      response.status
    );
  }

  return data;
}

export async function githubSearch(path, query, perPage = 1) {
  return githubRequest(
    `${path}?q=${encodeURIComponent(query)}&per_page=${perPage}`
  );
}

export async function githubGraphqlRequest(query, variables) {
  if (!config.githubToken) {
    throw createError(
      "GITHUB_TOKEN is required for contribution chart data.",
      400
    );
  }

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      ...createHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.errors?.length) {
    throw createError(
      data.errors?.[0]?.message ||
        `GitHub GraphQL request failed with ${response.status}`,
      response.status
    );
  }

  return data.data;
}

export async function fetchAllUserRepos(username) {
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
