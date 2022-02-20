# WebRTC Server

Check out the [live demo](https://webrtc-server-client.leede.ee/demo/) or the [documentation](https://webrtc-server-client.leede.ee/docs/).

## Server installation

```sh
npm install @leede/webrtc-server
```

## Basic server usage example

```ts
import { WebRTCServer } from "@leede/webrtc-server";

const server = new WebRTCServer({
  port: 8000,
  iceServers: ["stun:stun.l.google.com:19302"],
});

server.on("connection", (connection) => {
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
