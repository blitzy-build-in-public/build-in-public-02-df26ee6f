# Minimal Node.js HTTP Server

## Project Purpose

A minimal, dependency-free Node.js HTTP server that demonstrates how to create a server and route a single endpoint using nothing but the built-in `http` module.

It responds to exactly two cases:

- `GET /hello` returns `200 OK` with the plain-text body `Hello world`.
- Every other method and path returns `404 Not Found` with the plain-text body `Not Found`.

The whole application is the single file `server.js`. It has no dependencies, no build step and no configuration file, so it can be read from top to bottom and run as it stands.

## Prerequisites

- Node.js v18.0.0 or later — the floor declared by the `engines.node` field (`>=18.0.0`) in `package.json`.
- Nothing else: no database, no other service and no global tool.

Check the Node.js version you have:

```bash
node --version
```

For example, on a machine that satisfies the requirement:

```console
v22.23.3
```

Any version at or above v18.0.0 works.

## Installation

None. The server declares no dependencies, so `npm install` is not needed and the repository is ready to run as cloned.

## Execution

Start the server from the repository root:

```bash
node server.js
```

The npm script runs the same command:

```bash
npm start
```

The server keeps running until you stop it, as the Shutdown section below describes.

To listen on a different port, set the `PORT` environment variable:

```bash
PORT=4000 node server.js
```

```bash
PORT=4000 npm start
```

The server then answers on port 4000 at `http://localhost:4000/hello`.

## Testing

With the server running on port 3000, run these commands from a second terminal.

Request the one endpoint:

```bash
curl http://localhost:3000/hello
```

```console
Hello world
```

Show the response status and content type with `curl -i`:

```bash
curl -i http://localhost:3000/hello
```

```console
HTTP/1.1 200 OK
Content-Type: text/plain
Date: Mon, 19 Oct 2026 08:37:06 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

Hello world
```

Only the status line and the `Content-Type` header are produced by this server; `Date`, `Connection`, `Keep-Alive` and `Transfer-Encoding` are added by Node.js.

Request a path that does not exist:

```bash
curl http://localhost:3000/invalid
```

```console
Not Found
```

Request `/hello` with a method other than `GET`:

```bash
curl -X POST http://localhost:3000/hello
```

```console
Not Found
```

Both endpoints, in one table:

| Method | Path | Status | `Content-Type` | Body |
|--------|------|--------|----------------|------|
| `GET` | `/hello` | `200 OK` | `text/plain` | `Hello world` |
| Any other method | Anything else | `404 Not Found` | `text/plain` | `Not Found` |

Matching is exact and case-sensitive, and is decided on the path alone:

- A query string takes no part in the match, so `curl 'http://localhost:3000/hello?x=1'` returns `Hello world`.
- `/hello/`, `/HELLO` and `//hello` are not the path `/hello`, so each returns `Not Found`.
- `HEAD /hello` is not `GET`, so it returns `404 Not Found` with the headers of a 404 and no body.

## Expected Output

Starting the server prints one line:

```console
Server listening on port 3000
```

Every incoming request is logged before it is routed, in the format `[ISO-8601 timestamp] [HTTP method] [request path]`:

```console
[2026-10-19T08:37:06.990Z] GET /hello
[2026-10-19T08:37:06.997Z] GET /hello
[2026-10-19T08:37:07.002Z] GET /invalid
[2026-10-19T08:37:07.008Z] POST /hello
```

Those four lines are the testing requests above, in order — the two calls to `/hello`, one of them with `-i`, then `/invalid`, then the `POST` to `/hello`. The timestamp is UTC, so each response appears in the terminal that issued the `curl` command while its log line appears in the terminal running the server. The logged path never carries a query string: the log line for `curl 'http://localhost:3000/hello?x=1'` reads `GET /hello`.

## Shutdown

Press CTRL+C in the terminal that is running the server. The server stops accepting connections, releases idle connections, lets in-flight responses finish, and exits with status 0:

```console
Shutting down server on port 3000
Server closed. Exiting.
```

## Environment Variable Configuration

`PORT` is the only configuration input. When the variable is unset the server listens on port 3000, on every interface of the machine it runs on.

| `PORT` | Result |
|--------|--------|
| unset | listens on `3000` |
| `4000` | listens on `4000` |
| `1024` | accepted — the lowest accepted port |
| `65535` | accepted — the highest accepted port |
| `abc`, `3000abc`, `3000.5` | rejected — not an integer |
| `1e3`, `0x10` | rejected — an integer, but below the smallest accepted port |
| `80`, `1023` | rejected — below 1024: privileged ports are never bound |
| `65536` | rejected — above 65535 |

An invalid value is reported on standard error, no port is bound, and the process exits with status 1:

```bash
PORT=abc node server.js
```

```console
Invalid PORT value "abc". PORT must be an integer between 1024 and 65535.
```

The offending value is quoted exactly as it was set, so `PORT=80 node server.js` reports:

```console
Invalid PORT value "80". PORT must be an integer between 1024 and 65535.
```

Ports below 1024 are privileged, and no flag or setting relaxes that rule: set `PORT` to 1024 or above.

If the port is already in use, the server says so instead of crashing with a stack trace, and exits with status 1:

```console
Cannot start server: port 3000 is already in use (EADDRINUSE). Set PORT to a free port.
```

Choosing another port with `PORT` is the remedy, as the message states.
