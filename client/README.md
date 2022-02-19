# WebRTC Client

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

The client can also be used by downloading `leede-webrtc-client.js` from the [releases page](https://github.com/leede-org/webrtc-server-client/releases) and including the script on a webpage. The script defines a global `leede` namespace wherein the `WebRTCClient` class is available.

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

For detailed usage, see the [client documentation](https://webrtc-server-client.leede.ee/docs/modules/_leede_webrtc_client.html).
