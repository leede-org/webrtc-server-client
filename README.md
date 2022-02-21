# WebRTC server-client

The WebRTC server-client package provides a Node.js server that acts as a central peer for WebRTC connections. This is beneficial in use-cases where the reliable and ordered messaging of the WebSocket protocol is a limiting factor, such as web-based multiplayer games. The server sets up two data channels for each incoming connection - one for reliable messaging and another one for unreliable messaging. This allows for applications to use a unified messaging mechanism to implement features that require either reliable transports such as a chat room or unreliable transports such as syncing game state.

The client can be used in a browser as well as in a Node.js context.

Check out the [live demo](https://webrtc-server-client.leede.ee/demo/) or the [documentation](https://webrtc-server-client.leede.ee/docs/).

## Server

### Server installation

```sh
npm install @leede/webrtc-server
```

### Basic server usage example

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

### Running the server alongside an express app

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

## Client

### Client installation

#### Using a bundler such as webpack or browserify

When using a bundler such as webpack or browserify then import `WebRTCClient` from the `@leede/webrtc-client` package.

```sh
npm install @leede/webrtc-server
```

```ts
import { WebRTCClient } from "@leede/webrtc-client";
```

#### Using bundled script to use the client on a webpage globally

The client can also be used by downloading `leede-webrtc-client-*.js` from the [releases listing](https://webrtc-server-client.leede.ee/releases/) and including the script on a webpage. The script defines a global `leede` namespace wherein the `WebRTCClient` class is available.

```html
<script src="leede-webrtc-client.js"></script>
<script>
  const client = new leede.WebRTCClient("ws://localhost:8000");
</script>
```

#### Using the client in Node.js

The client can also be used in a Node.js context by providing some global variables from `ws` and `wrtc` packages.

```sh
npm install ws wrtc @leede/webrtc-server
```

```ts
const ws = require("ws");
const wrtc = require("wrtc");

global.WebSocket = ws.WebSocket;
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

// WebRTCClient can now be imported and used
import { WebRTCClient } from "@leede/webrtc-client";
```

### Basic client usage example

```ts
import { WebRTCClient } from "@leede/webrtc-client";

const wrc = new WebRTCClient("ws://localhost:8000");

wrc.on("open", () => {
  console.log("[CLIENT] Connected");

  // Send reliable TCP messages
  wrc.sendR("Hello from client over TCP");
  wrc.sendR(new Float32Array([1.0, 3.14]).buffer);

  // Send unreliable UDP messages
  wrc.sendU("Hello from client over UDP");
  wrc.sendU(Buffer.from([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]));
});

// Handle string messages from server
wrc.on("message", (message) => {
  console.log("[CLIENT] Received message:", message);
});

// Handle binary messages from server
wrc.on("binary", (buffer) => {
  console.log("[CLIENT] Received buffer:", buffer);
});
```

For detailed usage, see the [client documentation](https://webrtc-server-client.leede.ee/docs/modules/_leede_webrtc_client.html).

## Binary messaging

This library uses the `"arraybuffer"` type for binary messaging but it does not limit the types of messages that can be passed between the server and client in any way. Here are some examples for how various types of data can be passed between `WebRTCServer` and `WebRTCClient`.

### Sending and receiving typed arrays

#### Send and receive typed arrays in the server

```ts
wrs.on("connection", (connection) => {
  // Send typed array to client
  const float32ArrayFromServer = new Float32Array([3.14, 1.618]);
  connection.sendR(float32ArrayFromServer.buffer);

  // Receive typed array from client (see what client is sending below)
  connection.on("binary", (arrayBuffer) => {
    const uint16ArrayFromClient = new Uint16Array(arrayBuffer);
    console.log(uint16ArrayFromClient); // Uint16Array([33, 45])
  });
});
```

#### Send and receive typed arrays in the client

```ts
wrc.on("open", () => {
  // Send typed array to server
  const uint16ArrayFromClient = new Uint16Array([33, 45]);
  wrc.sendR(uint16ArrayFromClient.buffer);
});

// Receive typed array from server (see what server is sending above)
wrc.on("binary", (arrayBuffer) => {
  const float32ArrayFromServer = new Float32Array(arrayBuffer);
  console.log(float32ArrayFromServer); // Float32Array([3.14, 1.618])
});
```

### Sending and receiving generic binary data

#### Send and receive generic binary data in the server

```ts
// Server
wrs.on("connection", (connection) => {
  // Send buffer to client
  const buffer = Buffer.alloc(6);
  buf.writeUint8(50, 0);
  buf.writeUint8(125, 1);
  buf.writeFloatLE(1.47, 2);
  connection.sendR(buffer);

  // Receive buffer from client (see what client is sending below)
  connection.on("binary", (arrayBuffer) => {
    const buffer = Buffer.from(arrayBuffer);
    console.log(buffer.readFloatLE(0)); // 3.14
    console.log(buffer.readUint32LE(4)); // 1234
    console.log(buffer.readUint16LE(8)); // 600
  });
});
```

#### Send and receive generic binary data in the client

As there is no native `Buffer` implementation in browsers as there is in Node.js then you can manipulate a `Uint8Array` to exchange binary data with the server. Alternatively, you can install and use the `buffer` package to exchange data more comfortably.

```sh
npm install buffer
```

```ts
import { Buffer } from "buffer";

wrc.on("open", () => {
  // Send buffer to server
  const buffer = Buffer.alloc(10);
  buf.writeFloatLE(3.14, 0);
  buf.writeUint32LE(1234, 4);
  buf.writeUint16LE(600, 8);
  wrc.sendR(buffer);
});

// Receive buffer from server (see what server is sending above)
wrc.on("binary", (arrayBuffer) => {
  const buffer = Buffer.from(arrayBuffer);
  console.log(buffer.readUint8(0)); // 50
  console.log(buffer.readUint8(1)); // 125
  console.log(buffer.readFloatLE(2)); // 1.47
});
```
