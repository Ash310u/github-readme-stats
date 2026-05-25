import {
  fetchAllUserRepos,
  githubGraphqlRequest,
  githubRequest,
  githubSearch
} from "./github.service.js";
import { formatShortDate } from "../utils/format.js";

function collectSearchRepositories(searchResults) {
  return searchResults.items
    .map((item) => item.repository?.full_name || item.repository_url)
    .filter(Boolean);
}

function getDefaultDateRange() {
  const now = new Date();
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)),
    to: now
  };
}

function normalizeDate(value, fallback) {
  if (!value) {
    return fallback;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function flattenContributionDays(calendar) {
  return calendar.weeks.flatMap((week) => week.contributionDays);
}

function calculateStreaks(days) {
  let currentCount = 0;
  let longestCount = 0;
  let activeCount = 0;
  let activeStart = null;
  let longestStart = null;
  let longestEnd = null;

  for (const day of days) {
    if (day.contributionCount > 0) {
      activeStart ||= day.date;
      activeCount += 1;
    } else {
      if (activeCount > longestCount) {
        longestCount = activeCount;
        longestStart = activeStart;
        longestEnd = days[days.indexOf(day) - 1]?.date || activeStart;
      }

      activeCount = 0;
      activeStart = null;
    }
  }

  if (activeCount > longestCount) {
    longestCount = activeCount;
    longestStart = activeStart;
    longestEnd = days.at(-1)?.date || activeStart;
  }

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].contributionCount === 0) {
      break;
    }

    currentCount += 1;
  }

  return {
    current: {
      count: currentCount,
      label: currentCount > 0 ? formatShortDate(days.at(-1)?.date) : "No active streak"
    },
    longest: {
      count: longestCount,
      range:
        longestStart && longestEnd
          ? `${formatShortDate(longestStart)} - ${formatShortDate(longestEnd)}`
          : "No contributions"
    }
  };
}

export async function fetchGithubStats(username) {
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

export async function fetchContributionChartStats(username, options = {}) {
  const range = getDefaultDateRange();
  const from = normalizeDate(options.from, range.from);
  const to = normalizeDate(options.to, range.to);

  const query = `
    query ContributionChart($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        login
        name
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;

  const data = await githubGraphqlRequest(query, {
    login: username,
    from: from.toISOString(),
    to: to.toISOString()
  });

  const user = data.user;

  if (!user) {
    const error = new Error(`GitHub user "${username}" was not found.`);
    error.status = 404;
    throw error;
  }

  const calendar = user.contributionsCollection.contributionCalendar;
  const days = flattenContributionDays(calendar);
  const streaks = calculateStreaks(days);

  return {
    username: user.login,
    name: user.name,
    totalContributions: calendar.totalContributions,
    currentStreak: streaks.current.count,
    currentStreakLabel: streaks.current.label,
    longestStreak: streaks.longest.count,
    longestStreakRange: streaks.longest.range,
    rangeLabel: `${formatShortDate(from)} - ${options.to ? formatShortDate(to) : "Present"}`
  };
}
