# WebRTC Client

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

Alternatively, the client can also be used by downloading `leede-webrtc-client.js` from the [releases page](https://github.com/leede-org/webrtc-server-client/releases) and including the script on a webpage. The script defines a global `Leede` namespace wherein the `WebRTCClient` class is.

```html
<script src="leede-webrtc-client.js"></script>
<script>
  const client = new Leede.WebRTCClient("ws://localhost:8000");
</script>
```

The client can also be used in a Node.js context by providing some global variables from `ws` and `wrtc` packages.

```ts
const ws = require("ws");
const wrtc = require("wrtc");

global.WebSocket = ws.WebSocket;
global.RTCPeerConnection = wrtc.RTCPeerConnection;
global.RTCSessionDescription = wrtc.RTCSessionDescription;

// WebRTCClient can now be imported and used
import { WebRTCClient } from "@leede/webrtc-client";
```
