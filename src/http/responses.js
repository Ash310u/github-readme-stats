export function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=300",
    ...headers
  });
  response.end(body);
}

export function sendJson(response, status, payload) {
  send(response, status, JSON.stringify(payload, null, 2), {
    "Content-Type": "application/json; charset=utf-8"
  });
}

export function sendSvg(response, svg) {
  send(response, 200, svg, {
    "Content-Type": "image/svg+xml; charset=utf-8"
  });
}
