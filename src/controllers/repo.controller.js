import { fetchRepoStars } from "../services/github.service.js";
import { sendJson } from "../http/responses.js";

const DEFAULT_REPO = {
  owner: "Ash310u",
  name: "github-readme-stats"
};

export async function handleRepoStars(request, response) {
  try {
    const stars = await fetchRepoStars(DEFAULT_REPO.owner, DEFAULT_REPO.name);

    sendJson(response, 200, {
      owner: DEFAULT_REPO.owner,
      repo: DEFAULT_REPO.name,
      stars,
      url: `https://github.com/${DEFAULT_REPO.owner}/${DEFAULT_REPO.name}`
    });
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: error.message || "Unable to fetch repository stars"
    });
  }
}
