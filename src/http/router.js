import {
  handleActivity,
  handleCustom,
  handleHeatmap,
  handleLanguages,
  handleRepos,
  handleStats,
  handleStatsChart,
  handleWeekly
} from "../controllers/stats.controller.js";
import { sendJson } from "./responses.js";
import { sendStaticFile } from "./static.js";

const routes = [
  { path: "/api/stats", handler: handleStats },
  { path: "/api/stats/custom", handler: handleCustom },
  { path: "/api/stats/chart", handler: handleStatsChart },
  { path: "/api/stats/languages", handler: handleLanguages },
  { path: "/api/stats/repos", handler: handleRepos },
  { path: "/api/stats/activity", handler: handleActivity },
  { path: "/api/stats/heatmap", handler: handleHeatmap },
  { path: "/api/stats/weekly", handler: handleWeekly }
];

export async function routeRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  for (const route of routes) {
    if (url.pathname === route.path) {
      await route.handler(request, response, url);
      return;
    }
  }

  if (url.pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      endpoints: {
        stats: "/api/stats?username=Ash310u",
        custom: "/api/stats/custom?username=Ash310u&theme=github_dark&elements=stars,prs,issues,heatmap",
        chart: "/api/stats/chart?username=Ash310u",
        languages: "/api/stats/languages?username=Ash310u",
        repos: "/api/stats/repos?username=Ash310u",
        activity: "/api/stats/activity?username=Ash310u",
        heatmap: "/api/stats/heatmap?username=Ash310u",
        weekly: "/api/stats/weekly?username=Ash310u"
      }
    });
    return;
  }

  if (await sendStaticFile(response, url.pathname)) {
    return;
  }

  sendJson(response, 404, {
    error: "Not found"
  });
}
