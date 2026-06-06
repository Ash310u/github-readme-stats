import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = fileURLToPath(new URL("../../public/", import.meta.url));

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function getStaticPath(pathname) {
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const normalizedPath = normalize(relativePath);

  if (normalizedPath.startsWith("..")) {
    return null;
  }

  return join(publicDir, normalizedPath);
}

export async function sendStaticFile(response, pathname) {
  const filePath = getStaticPath(pathname);

  if (!filePath) {
    return false;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
    });
    response.end(content);
    return true;
  } catch {
    return false;
  }
}
