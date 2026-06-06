import {
  fetchActivityStats,
  fetchCustomCardStats,
  fetchContributionChartStats,
  fetchContributionHeatmapStats,
  fetchGithubStats,
  fetchLanguageStats,
  fetchRepoStats,
  fetchWeeklyContributionStats
} from "../services/stats.service.js";
import { renderActivityCardSvg } from "../renderers/activity-card.js";
import {
  getElementSources,
  parseCardCustomization,
  parseCustomElements,
  renderCustomCardSvg
} from "../renderers/custom-card.js";
import { renderHeatmapCardSvg } from "../renderers/heatmap-card.js";
import { renderLanguagesCardSvg } from "../renderers/languages-card.js";
import { renderReposCardSvg } from "../renderers/repos-card.js";
import { renderStatsCardSvg } from "../renderers/stats-card.js";
import { renderStatsChartSvg } from "../renderers/stats-chart.js";
import { renderWeeklyChartSvg } from "../renderers/weekly-chart.js";
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

function getRequestOptions(url) {
  return {
    format: url.searchParams.get("format") || "svg",
    theme: url.searchParams.get("theme") || "github_light",
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to")
  };
}

async function handleCardRequest({ request, response, url, fetchStats, renderSvg, errorMessage }) {
  const username = getRequiredUsername(url, response);

  if (!username) {
    return;
  }

  const { format, theme, from, to } = getRequestOptions(url);

  try {
    const stats = await fetchStats(username, { from, to });

    if (format === "json") {
      sendJson(response, 200, stats);
      return;
    }

    sendSvg(response, renderSvg(stats, theme));
  } catch (error) {
    handleError(response, error, errorMessage);
  }
}

export async function handleStats(request, response, url) {
  await handleCardRequest({
    request,
    response,
    url,
    fetchStats: fetchGithubStats,
    renderSvg: renderStatsCardSvg,
    errorMessage: "Unable to fetch GitHub stats"
  });
}

export async function handleStatsChart(request, response, url) {
  await handleCardRequest({
    request,
    response,
    url,
    fetchStats: fetchContributionChartStats,
    renderSvg: renderStatsChartSvg,
    errorMessage: "Unable to fetch GitHub contribution chart"
  });
}

export async function handleLanguages(request, response, url) {
  await handleCardRequest({
    request,
    response,
    url,
    fetchStats: fetchLanguageStats,
    renderSvg: renderLanguagesCardSvg,
    errorMessage: "Unable to fetch language stats"
  });
}

export async function handleRepos(request, response, url) {
  await handleCardRequest({
    request,
    response,
    url,
    fetchStats: fetchRepoStats,
    renderSvg: renderReposCardSvg,
    errorMessage: "Unable to fetch repository stats"
  });
}

export async function handleActivity(request, response, url) {
  await handleCardRequest({
    request,
    response,
    url,
    fetchStats: fetchActivityStats,
    renderSvg: renderActivityCardSvg,
    errorMessage: "Unable to fetch activity stats"
  });
}

export async function handleHeatmap(request, response, url) {
  await handleCardRequest({
    request,
    response,
    url,
    fetchStats: fetchContributionHeatmapStats,
    renderSvg: renderHeatmapCardSvg,
    errorMessage: "Unable to fetch contribution heatmap"
  });
}

export async function handleWeekly(request, response, url) {
  await handleCardRequest({
    request,
    response,
    url,
    fetchStats: fetchWeeklyContributionStats,
    renderSvg: renderWeeklyChartSvg,
    errorMessage: "Unable to fetch weekly contribution chart"
  });
}

export async function handleCustom(request, response, url) {
  const username = getRequiredUsername(url, response);

  if (!username) {
    return;
  }

  const { format, from, to } = getRequestOptions(url);
  const theme = url.searchParams.get("theme") || "github_dark";
  const elementsParam = url.searchParams.has("elements") ? url.searchParams.get("elements") : null;
  const widgetsParam = url.searchParams.has("widgets") ? url.searchParams.get("widgets") : null;
  const elements = parseCustomElements(elementsParam, widgetsParam);
  const sources = getElementSources(elements);
  const customization = parseCardCustomization(url.searchParams);

  if (elements.length === 0) {
    sendJson(response, 400, {
      error: "At least one valid element is required. Use the elements query parameter."
    });
    return;
  }

  try {
    const stats = await fetchCustomCardStats(username, sources, { from, to });

    if (format === "json") {
      sendJson(response, 200, { elements, customization, ...stats });
      return;
    }

    sendSvg(response, renderCustomCardSvg(stats, theme || "github_dark", elements, customization));
  } catch (error) {
    handleError(response, error, "Unable to fetch custom GitHub stats card");
  }
}
