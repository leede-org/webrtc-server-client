# WebRTC Client

This package provides the client-side library for connecting to an instance of the server provided in the `@leede/webrtc-server` package. The client can be used in a browser as well as in a Node.js context.

Check out the [live demo](https://webrtc-server-client.leede.ee/demo/) or the [documentation](https://webrtc-server-client.leede.ee/docs/).

## Client installation

### Using a bundler such as webpack or browserify

When using a bundler such as webpack or browserify then import `WebRTCClient` from the `@leede/webrtc-client` package.

```sh
npm install @leede/webrtc-server
```

```ts
import { WebRTCClient } from "@leede/webrtc-client";
```

### Using bundled script to use the client on a webpage globally

The client can also be used by downloading `leede-webrtc-client-*.js` from the [releases listing](https://webrtc-server-client.leede.ee/releases/) and including the script on a webpage. The script defines a global `leede` namespace wherein the `WebRTCClient` class is available.

```html
<script src="leede-webrtc-client.js"></script>
<script>
  const client = new leede.WebRTCClient("ws://localhost:8000");
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

## Basic client usage example

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
