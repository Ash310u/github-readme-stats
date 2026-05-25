import {
  fetchContributionChartStats,
  fetchGithubStats
} from "../services/stats.service.js";
import { renderStatsCardSvg } from "../renderers/stats-card.js";
import { renderStatsChartSvg } from "../renderers/stats-chart.js";
import { sendJson, sendSvg } from "../http/responses.js";

function getRequiredUsername(url, response) {
  const username = url.searchParams.get("username");

  if (!username) {
    sendJson(response, 400, {
      error: "Missing required query parameter: username"
    });
    return null;
  }

  return username;
}

function handleError(response, error, fallbackMessage) {
  sendJson(response, error.status || 500, {
    error: error.message || fallbackMessage
  });
}

export async function handleStats(request, response, url) {
  const username = getRequiredUsername(url, response);
  const format = url.searchParams.get("format") || "svg";
  const theme = url.searchParams.get("theme") || "github_light";

  if (!username) {
    return;
  }

  try {
    const stats = await fetchGithubStats(username);

    if (format === "json") {
      sendJson(response, 200, stats);
      return;
    }

    sendSvg(response, renderStatsCardSvg(stats, theme));
  } catch (error) {
    handleError(response, error, "Unable to fetch GitHub stats");
  }
}

export async function handleStatsChart(request, response, url) {
  const username = getRequiredUsername(url, response);
  const format = url.searchParams.get("format") || "svg";
  const theme = url.searchParams.get("theme") || "github_light";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!username) {
    return;
  }

  try {
    const stats = await fetchContributionChartStats(username, { from, to });

    if (format === "json") {
      sendJson(response, 200, stats);
      return;
    }

    sendSvg(response, renderStatsChartSvg(stats, theme));
  } catch (error) {
    handleError(response, error, "Unable to fetch GitHub contribution chart");
  }
}
