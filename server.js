const http = require('http');

let server = null;
let listeningPort = null;

// Resolve the port to bind from the PORT environment variable, validating it before use.
function resolvePort() {
  const rawPort = process.env.PORT;

  if (rawPort === undefined) {
    return 3000;
  }

  const port = Number(rawPort);

  if (Number.isInteger(port) && port >= 1024 && port <= 65535) {
    return port;
  }

  console.error(`Invalid PORT value "${rawPort}". PORT must be an integer between 1024 and 65535.`);
  process.exitCode = 1;

  return null;
}

// Log one line for every incoming request, in a fixed format, before routing it.
function logRequest(method, pathname) {
  console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);
}

// Write a plain-text response: the only place this program answers a request.
function sendText(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  res.end(body);
}

// Serve one request: log it, resolve its path, match it and answer exactly once.
function handleRequest(req, res) {
  let pathname = null;

  try {
    // Matching on the parsed pathname rather than the raw request target keeps a query string
    // out of the comparison, so GET /hello?x=1 still resolves to /hello.
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    // A hostile request target such as /\ or http://[::1 makes new URL throw; such a request
    // is still logged and answered with the ordinary 404 contract, not a reset connection.
    // The logged field drops any query string here too, so the logged path never carries one.
    pathname = null;
  }

  logRequest(req.method, pathname === null ? req.url.split('?')[0] : pathname);

  if (req.method === 'GET' && pathname === '/hello') {
    sendText(res, 200, 'Hello world');

    return;
  }

  sendText(res, 404, 'Not Found');
}

// Report a fatal server error on stderr, so the process exits instead of crashing.
function handleServerError(error) {
  const code = error.code || error.name;

  if (code === 'EADDRINUSE') {
    console.error(
      `Cannot start server: port ${listeningPort} is already in use (EADDRINUSE). ` +
        'Set PORT to a free port.'
    );
  } else {
    console.error(`Cannot start server on port ${listeningPort}: ${code} ${error.message}`);
  }

  process.exitCode = 1;
}

// Close the server cleanly on CTRL+C: release idle connections, stop accepting, exit 0.
function handleShutdown() {
  console.log(`Shutting down server on port ${listeningPort}`);

  // Releasing idle keep-alive sockets is what lets server.close() finish promptly instead of
  // waiting out the keep-alive timeout; the typeof guard keeps the call valid at the declared
  // Node 18.0.0 floor, where closeIdleConnections (added in v18.2.0) is not yet present.
  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }

  server.close(() => {
    console.log('Server closed. Exiting.');

    // The status is set through process.exitCode rather than process.exit(), which would
    // discard these buffered stdout lines before the process ends.
    process.exitCode = 0;
  });
}

// Build the server, wire its handlers and start listening on the resolved port.
function startServer(port) {
  // resolvePort() returns null when PORT is rejected, and nothing may be bound then: this guard
  // is what keeps that value away from server.listen, which accepts an undefined argument by
  // binding an arbitrary ephemeral port instead of failing.
  if (typeof port !== 'number') {
    return;
  }

  listeningPort = port;
  server = http.createServer(handleRequest);
  server.on('error', handleServerError);
  process.on('SIGINT', handleShutdown);

  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer(resolvePort());
