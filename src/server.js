import { createServer } from "node:http";
import { config } from "./config/env.js";
import { routeRequest } from "./http/router.js";

const server = createServer(routeRequest);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${config.port} is already in use. Try PORT=3001 npm run dev.`
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

server.listen(config.port, config.host, () => {
  console.log(`github-stats listening on http://${config.host}:${config.port}`);
});
