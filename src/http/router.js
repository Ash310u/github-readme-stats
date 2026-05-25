import { handleStats, handleStatsChart } from "../controllers/stats.controller.js";
import { sendJson } from "./responses.js";

export async function routeRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/stats") {
    await handleStats(request, response, url);
    return;
  }

  if (url.pathname === "/api/stats/chart") {
    await handleStatsChart(request, response, url);
    return;
  }

  if (url.pathname === "/" || url.pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      endpoints: {
        stats: "/api/stats?username=Ash310u",
        chart: "/api/stats/chart?username=Ash310u"
      }
    });
    return;
  }

  sendJson(response, 404, {
    error: "Not found"
  });
}
