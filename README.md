# WebRTC server-client

The WebRTC server-client package provides a Node.js server that acts as a central peer for WebRTC connections. This is beneficial in use-cases where the reliable and ordered messaging of the WebSocket protocol is a limiting factor, such as web-based multiplayer games. The server sets up two data channels for each incoming connection - one for reliable messaging and another one for unreliable messaging. This allows for applications to use a unified messaging mechanism to implement features that require either reliable transports such as a chat room or unreliable transports such as syncing game state.

The client can be used in a browser as well as in a Node.js context.

See a live demo at <https://leede.ee/nodejs/webrtc-server-client/>. The source code of the live demo is in the `example` directory in this repository.

## Server-side usage

```sh
npm install @leede/webrtc-server
```

```ts
import { WebRTCServer } from "@leede/webrtc-server";

const server = new WebRTCServer({
  port: 8000,
  iceServers: ["stun:stun.l.google.com:19302"],
});

server.onconnection = (connection) => {
  console.log("[SERVER] New connection");

  // Send reliable messages
  connection.sendR("Hello from server over TCP");
  connection.sendR(new Float32Array([1.618, 1.414]).buffer);

  // Send unreliable messages
  connection.sendU("Hello from server over UDP");
  connection.sendU(Buffer.from([1, 4, 9, 16, 25, 36]));

  // Handle string messages from connection
  connection.onmessage = (message) => {
    console.log("[SERVER] Received message:", message);
  };

  // Handle binary messages from connection
  connection.onbinary = (buffer) => {
    console.log("[SERVER] Received buffer:", buffer);
  };

  // Handle disconnection
  connection.onclose = () => {
    console.log("Connection closed");
  };
};
```

## Client-side usage

### Using a bundler such as webpack or browserify

When using a bundler such as webpack or browserify then import `WebRTCClient` from the `@leede/webrtc-client` package.

```sh
npm install @leede/webrtc-server
```

```ts
import { WebRTCClient } from "@leede/webrtc-client";

const client = new WebRTCClient("ws://localhost:8000");

client.onopen = () => {
  console.log("[CLIENT] Connected");

  // Send reliable TCP messages
  client.sendR("Hello from client over TCP");
  client.sendR(new Float32Array([1.0, 3.14]).buffer);

  // Send unreliable UDP messages
  client.sendU("Hello from client over UDP");
  client.sendU(Buffer.from([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]));
};

// Handle string messages from server
client.onmessage = (message) => {
  console.log("[CLIENT] Received message:", message);
};

// Handle binary messages from server
client.onbinary = (buffer) => {
  console.log("[CLIENT] Received buffer:", buffer);
};
```

### Using bundled script to use the client on a webpage globally

Alternatively, the client can also be used by downloading `leede-webrtc-client.js` from the [releases page](https://github.com/leede-org/webrtc-server-client/releases) and including the script on a webpage. The script defines a global `Leede` namespace wherein the `WebRTCClient` class is.

```html
<script src="leede-webrtc-client.js"></script>
<script>
  const client = new Leede.WebRTCClient("ws://localhost:8000");
</script>
```

### Using the client in Node.js

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
