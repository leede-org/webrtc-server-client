# WebRTC Server

The package provides a Node.js server that acts as a central peer for WebRTC connections. This is beneficial in use-cases where the reliable and ordered messaging of the WebSocket protocol is a limiting factor, such as web-based multiplayer games. The server sets up two data channels for each incoming connection - one for reliable messaging and another one for unreliable messaging. This allows for applications to use a unified messaging mechanism to implement features that require either reliable transports such as a chat room or unreliable transports such as syncing game state.

Check out the [live demo](https://webrtc-server-client.leede.ee/demo/) or the [documentation](https://webrtc-server-client.leede.ee/docs/).

## Server installation

```sh
npm install @leede/webrtc-server
```

## Basic server usage example

```ts
import { WebRTCServer } from "@leede/webrtc-server";

const wrs = new WebRTCServer({
  port: 8000,
  iceServers: ["stun:stun.l.google.com:19302"],
});

wrs.on("connection", (connection) => {
  console.log("[SERVER] New connection");

  // Send reliable messages
  connection.sendR("Hello from server over TCP");
  connection.sendR(new Float32Array([1.618, 1.414]).buffer);

  // Send unreliable messages
  connection.sendU("Hello from server over UDP");
  connection.sendU(Buffer.from([1, 4, 9, 16, 25, 36]));

  // Handle string messages from connection
  connection.on("message", (message) => {
    console.log("[SERVER] Received message:", message);
  });

  // Handle binary messages from connection
  connection.on("binary", (buffer) => {
    console.log("[SERVER] Received buffer:", buffer);
  });

  // Handle disconnection
  connection.on("close", () => {
    console.log("Connection closed");
  });
});
```

For detailed usage, see the [server documentation](https://webrtc-server-client.leede.ee/docs/modules/_leede_webrtc_server.html).

## Running the server alongside an express app

Instead of binding the `WebRTCServer` to a specific port, you can alternatively provide an instance of the `http.Server` class. This allows you to bind an express application and serve HTTP requests on the same server.

```ts
import * as http from "http";
import * as express from "express";

const app = express();
const httpServer = new http.Server(app);

app.get("/", (req, res) => res.send("Hello, world!"));

const wrs = new WebRTCServer({
  server: httpServer,
  iceServers: ["stun:stun.l.google.com:19302"],
});

wrs.on("connection", (connection) => {
  // ...
});

httpServer.listen(8000);
```
